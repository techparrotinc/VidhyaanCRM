# Vidhyaan — Multi-Tenant Payment Gateway Integration (Razorpay-first)

**Status:** Design — approved for implementation
**Author:** Architecture review, 2026-07-06
**Scope:** Per-school Razorpay accounts, fee collection via Parent Portal, webhook-driven reconciliation, provider abstraction for future gateways (Stripe, Cashfree, PayU).

This design is grounded in the existing codebase: the `route()` composer (`src/lib/api/compose.ts`), fail-closed tenant client (`src/lib/db/tenant.ts`), pure fee math (`src/lib/fees.ts`), existing `Invoice`/`Payment` Prisma models, and `Plan`/`PlanModule` licensing. It **replaces** the legacy `src/lib/integrations/razorpay/index.ts` school-credential path (credentials in `Organization.settings` JSON, AES-CBC, dev mock fallbacks) — see §16 Migration.

---

## 1. Solution Architecture (text diagram)

```
┌────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                   │
│  School Admin (CRM)          Parent Portal            Platform Admin   │
│  /settings/payments          /parent/fees             /admin           │
└──────────┬──────────────────────┬──────────────────────────┬───────────┘
           │ HTTPS                │ Razorpay Checkout.js      │
           ▼                      ▼ (school's own key_id)     ▼
┌────────────────────────────────────────────────────────────────────────┐
│  Next.js API layer — route() composer                                  │
│  auth → role → org cache → module license (payment-gateway) →          │
│  read-only guard → tenant DB (forOrg)                                  │
│                                                                        │
│  /api/v1/payment-gateway/*      settings, credential verify, wizard    │
│  /api/v1/fees/invoices/[id]/checkout   create gateway order            │
│  /api/parent/v1/fees/*          parent-facing invoices + checkout      │
│  /api/webhooks/payments/[provider]/[orgId]   per-tenant webhook intake │
└──────────┬─────────────────────────────────────────────────────────────┘
           │
           ▼
┌────────────────────────────────────────────────────────────────────────┐
│  PAYMENT SERVICE LAYER  src/lib/payments/                              │
│                                                                        │
│  PaymentService (orchestrator — the ONLY thing Fee Mgmt talks to)      │
│    ├─ getProvider(orgId): PaymentProvider   ◄── provider registry      │
│    ├─ createCheckout(invoiceId, amount)                                │
│    ├─ recordGatewayPayment(event)   idempotent, transactional          │
│    ├─ refund(paymentId, amount)                                        │
│    └─ reconcile(orgId, dateRange)                                      │
│                                                                        │
│  PaymentProvider (interface)                                           │
│    ├─ RazorpayProvider        ◄── only file importing 'razorpay' SDK   │
│    ├─ (future) StripeProvider / CashfreeProvider / PayUProvider        │
│    └─ MockProvider (tests + local dev, explicit opt-in)                │
│                                                                        │
│  CredentialVault — AES-256-GCM encrypt/decrypt, key versioning         │
│  WebhookProcessor — verify → dedupe → persist event → apply → ack      │
└──────────┬───────────────────────────────┬─────────────────────────────┘
           │                               │
           ▼                               ▼
┌───────────────────────────┐   ┌─────────────────────────────────────────┐
│  Neon Postgres            │   │  Upstash Redis                          │
│  crm.invoices/payments    │   │  webhook idempotency fast-path,         │
│  billing.gateway_configs  │   │  checkout rate limits, org/module cache │
│  billing.gateway_orders   │   └─────────────────────────────────────────┘
│  billing.webhook_events   │
│  billing.refunds          │   ┌─────────────────────────────────────────┐
│  crm.ledger_entries       │   │  Vercel Cron (background jobs)          │
│  platform.audit_logs      │   │  /api/cron/payments-reconcile  (daily)  │
└───────────────────────────┘   │  /api/cron/payments-expire-orders (1h)  │
                                └─────────────────────────────────────────┘
                                          │
                                          ▼
                                ┌──────────────────────┐
                                │  Razorpay (per-org   │
                                │  account, test/live) │
                                └──────────────────────┘
```

**Dependency rule (Clean Architecture):** Fee Management imports `PaymentService` only. `PaymentService` imports the `PaymentProvider` interface only. Concrete providers import gateway SDKs. Nothing imports `razorpay` outside `src/lib/payments/providers/razorpay.ts`.

---

## 2. End-to-End Workflow

### 2a. School onboarding (setup wizard)
1. ORG_ADMIN on Premium plan opens **Settings → Payments**. Non-premium orgs see upsell empty state (module `payment-gateway` absent from their `PlanModule` set → composer returns 403 → UI renders upgrade CTA).
2. Wizard step 1: pick provider (Razorpay only for now), pick environment (**Test**).
3. Wizard step 2: paste `key_id` + `key_secret`. Server encrypts (AES-256-GCM) and calls provider `verifyCredentials()` — a zero-side-effect authenticated Razorpay API call (`GET /v1/payments?count=1`). Bad creds → inline error, config saved as `DRAFT`, never `ACTIVE`.
4. Wizard step 3: server generates per-org webhook secret + displays webhook URL `https://app.vidhyaan.com/api/webhooks/payments/razorpay/{orgId}`; admin registers it in the Razorpay dashboard (contextual help + doc links shown). "Send test webhook" button confirms receipt.
5. Wizard step 4: settings — allow partial payments (default from invoice policy), min partial amount, convenience-fee pass-through (off by default), receipt prefix. Activate → config `ACTIVE (TEST)`.
6. Go-live: repeat step 2–3 with live keys; toggle TEST→LIVE requires verified live credentials + verified live webhook. Both credential sets stored; toggle is instant and reversible.

### 2b. Parent payment (happy path)
1. Admin generates invoice (existing flow). No Razorpay order is created yet — orders are created **lazily at checkout**, not at invoice generation (Razorpay orders reference a fixed amount; lazy creation supports partial payments and avoids orphan orders for cash payers).
2. Parent opens Parent Portal → Fees → sees invoice with balance → clicks **Pay Now** (or **Pay Partial** if org allows; amount ≥ configured minimum).
3. `POST /api/parent/v1/fees/invoices/{id}/checkout {amount}` →
   - validate parent is linked to the student, invoice payable, `0 < amount ≤ remainingBalance` (reuse `fees.ts`),
   - `PaymentService.createCheckout` → `GatewayOrder` row (`CREATED`) + provider order via school's decrypted keys,
   - respond `{orderId, keyId, amount, prefill}`.
4. Client opens Razorpay Checkout.js with school's `key_id`. Parent pays.
5. Checkout success handler calls `POST /checkout/{orderId}/confirm` with `razorpay_payment_id/order_id/signature`. Server verifies HMAC signature with the school's key secret → marks payment `SUCCESS` **provisionally** and shows receipt page. This is UX acceleration only.
6. **Source of truth: webhook.** `payment.captured` arrives at the per-org endpoint → WebhookProcessor verifies signature with the org's webhook secret → idempotent apply: create/settle `Payment` row, recompute invoice status via `nextInvoiceStatus()`, write `LedgerEntry`, `AuditLog`, enqueue receipt email + notification. If step 5 never fired (parent closed tab), webhook alone completes the flow.
7. Reconciliation cron (daily): fetch provider payments for last 3 days per active org, diff against local `Payment` rows, flag/auto-heal mismatches.

### 2c. Failure / refund paths
- `payment.failed` webhook → mark `GatewayOrder` attempt failed; invoice untouched; parent sees "Retry" (new checkout on same or new order per provider rules).
- Refund initiated by ACCOUNTANT/ORG_ADMIN from Payment History → `PaymentService.refund` → provider refund API → `Refund` row `PENDING` → `refund.processed` webhook confirms → payment `REFUNDED`/`PARTIALLY_REFUNDED`, invoice status recomputed, negative `LedgerEntry`, audit log.

---

## 3. Database Schema (Prisma additions)

New enums + models in `billing` and `crm` schemas. Existing `Invoice`/`Payment` reused; small extensions only.

```prisma
enum GatewayProvider {
  RAZORPAY
  STRIPE     // future
  CASHFREE   // future
  PAYU       // future
  @@schema("billing")
}

enum GatewayEnvironment { TEST LIVE  @@schema("billing") }

enum GatewayConfigStatus {
  DRAFT       // creds saved, not verified
  VERIFIED    // creds verified, webhook not confirmed
  ACTIVE
  DISABLED    // admin toggled off
  SUSPENDED   // platform-forced (fraud/abuse)
  @@schema("billing")
}

enum GatewayOrderStatus {
  CREATED     // local row + provider order exist
  ATTEMPTED   // at least one payment attempt
  PAID
  FAILED      // terminal failure of latest attempt, retryable via new order
  EXPIRED     // TTL passed with no capture
  @@schema("billing")
}

enum RefundStatus { PENDING PROCESSED FAILED  @@schema("billing") }

enum WebhookEventStatus { RECEIVED PROCESSED SKIPPED FAILED  @@schema("billing") }

enum LedgerEntryType { CHARGE PAYMENT REFUND CONCESSION ADJUSTMENT  @@schema("crm") }

/// Per-org, per-provider, per-environment gateway credentials + policy.
model PaymentGatewayConfig {
  id                 String              @id @default(cuid())
  orgId              String              @map("org_id")
  provider           GatewayProvider     @default(RAZORPAY)
  environment        GatewayEnvironment  @default(TEST)
  status             GatewayConfigStatus @default(DRAFT)
  isCurrent          Boolean             @default(false) @map("is_current") // which env is live-toggled
  keyIdEncrypted     String              @map("key_id_encrypted")
  keySecretEncrypted String              @map("key_secret_encrypted")
  webhookSecretEnc   String              @map("webhook_secret_encrypted")   // we generate; admin pastes into RZP
  encryptionKeyVer   Int                 @default(1) @map("encryption_key_version")
  keyIdLast4         String?             @map("key_id_last4")               // display only
  allowPartial       Boolean             @default(true) @map("allow_partial")
  minPartialAmount   Decimal?            @map("min_partial_amount") @db.Decimal(12, 2)
  verifiedAt         DateTime?           @map("verified_at")
  webhookVerifiedAt  DateTime?           @map("webhook_verified_at")
  lastWebhookAt      DateTime?           @map("last_webhook_at")            // health indicator
  createdById        String?             @map("created_by_id")
  createdAt          DateTime            @default(now()) @map("created_at")
  updatedAt          DateTime            @updatedAt @map("updated_at")
  deletedAt          DateTime?           @map("deleted_at")

  organization Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)

  @@unique([orgId, provider, environment])
  @@index([orgId, status])
  @@map("payment_gateway_configs")
  @@schema("billing")
}

/// One provider order per checkout intent. Amount fixed at creation.
model GatewayOrder {
  id               String             @id @default(cuid())
  orgId            String             @map("org_id")
  provider         GatewayProvider
  environment      GatewayEnvironment
  invoiceId        String             @map("invoice_id")
  studentId        String?            @map("student_id")
  parentId         String?            @map("parent_id")          // who initiated
  amount           Decimal            @db.Decimal(12, 2)         // rupees; paise conversion at provider edge
  currency         String             @default("INR")
  status           GatewayOrderStatus @default(CREATED)
  providerOrderId  String             @map("provider_order_id")  // order_xxx
  providerPaymentId String?           @map("provider_payment_id") // pay_xxx once attempted
  failureCode      String?            @map("failure_code")
  failureReason    String?            @map("failure_reason")
  paymentId        String?            @unique @map("payment_id") // crm.payments row once settled
  expiresAt        DateTime           @map("expires_at")
  createdAt        DateTime           @default(now()) @map("created_at")
  updatedAt        DateTime           @updatedAt @map("updated_at")

  organization Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)
  invoice      Invoice      @relation(fields: [invoiceId], references: [id])

  @@unique([provider, providerOrderId])   // webhook lookup + cross-tenant guard
  @@index([orgId, status])
  @@index([orgId, invoiceId])
  @@index([status, expiresAt])            // expiry cron
  @@map("gateway_orders")
  @@schema("billing")
}

/// Every inbound webhook, verified or not. Idempotency + audit + replay.
model WebhookEvent {
  id             String             @id @default(cuid())
  orgId          String?            @map("org_id")               // null if org unresolvable
  provider       GatewayProvider
  providerEventId String            @map("provider_event_id")    // x-razorpay-event-id
  eventType      String             @map("event_type")
  status         WebhookEventStatus @default(RECEIVED)
  signatureValid Boolean            @map("signature_valid")
  payload        Json                                            // raw body (PII-scrubbed card data never present)
  error          String?
  processedAt    DateTime?          @map("processed_at")
  attempts       Int                @default(0)
  createdAt      DateTime           @default(now()) @map("created_at")

  @@unique([provider, providerEventId])   // DB-level idempotency backstop
  @@index([orgId, createdAt])
  @@index([status, createdAt])            // failed-event retry cron
  @@map("webhook_events")
  @@schema("billing")
}

model Refund {
  id               String       @id @default(cuid())
  orgId            String       @map("org_id")
  paymentId        String       @map("payment_id")   // crm.payments
  gatewayOrderId   String?      @map("gateway_order_id")
  amount           Decimal      @db.Decimal(12, 2)
  status           RefundStatus @default(PENDING)
  providerRefundId String?      @map("provider_refund_id") // rfnd_xxx
  reason           String?
  initiatedById    String       @map("initiated_by_id")
  processedAt      DateTime?    @map("processed_at")
  createdAt        DateTime     @default(now()) @map("created_at")
  updatedAt        DateTime     @updatedAt @map("updated_at")

  organization Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)
  payment      Payment      @relation(fields: [paymentId], references: [id])

  @@unique([orgId, providerRefundId])
  @@index([orgId, status])
  @@index([paymentId])
  @@map("refunds")
  @@schema("billing")
}

/// Append-only student money ledger. Debits = charges, credits = payments/refund-reversals.
model LedgerEntry {
  id          String          @id @default(cuid())
  orgId       String          @map("org_id")
  studentId   String          @map("student_id")
  invoiceId   String?         @map("invoice_id")
  paymentId   String?         @map("payment_id")
  refundId    String?         @map("refund_id")
  type        LedgerEntryType
  debit       Decimal         @default(0) @db.Decimal(12, 2)
  credit      Decimal         @default(0) @db.Decimal(12, 2)
  balance     Decimal         @db.Decimal(12, 2)  // running balance snapshot
  description String
  createdAt   DateTime        @default(now()) @map("created_at")

  organization Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)
  student      Student      @relation(fields: [studentId], references: [id])

  @@index([orgId, studentId, createdAt])
  @@index([invoiceId])
  @@map("ledger_entries")
  @@schema("crm")
}
```

**Extensions to existing models** (additive, backward-compatible):

```prisma
enum PaymentStatus {
  PENDING SUCCESS FAILED REFUNDED
  PARTIALLY_REFUNDED   // NEW
}

enum InvoiceStatus {
  UNPAID PARTIALLY_PAID PAID OVERDUE WAIVED SCHEDULED
  REFUNDED             // NEW — fully refunded after being paid
}

model Payment {
  // ... existing fields ...
  gatewayOrderId String? @map("gateway_order_id")  // link to billing.gateway_orders
  refundedAmount Decimal @default(0) @map("refunded_amount") @db.Decimal(12, 2)
  refunds        Refund[]
}
```

Notes:
- No `FAILED` invoice status: a failed **payment attempt** never changes invoice state — invoice stays UNPAID/PARTIALLY_PAID/OVERDUE. Failure lives on `GatewayOrder`/`Payment`. This keeps `nextInvoiceStatus()` in `fees.ts` pure and simple.
- Receipt numbering: replace the racy `count+1` pattern (see `invoices/[id]/pay/route.ts`) with a per-org sequence table or `INSERT ... ON CONFLICT` retry loop — required before gateway volume.
- Module licensing: seed `platform.modules` row `payment-gateway`, attach to premium `PlanModule`s. Composer's existing `module:` check does the gating — no new mechanism.

---

## 4. API Specifications

All CRM routes use the `route()` composer: `module: MODULES.PAYMENT_GATEWAY`, zod-validated, ZodError→422, tenant `db`.

### Gateway settings (CRM — ORG_ADMIN only; read also BRANCH_ADMIN/ACCOUNTANT)
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/v1/payment-gateway/config` | Both env configs, secrets masked (`keyIdLast4` only) |
| PUT | `/api/v1/payment-gateway/config/:environment` | Save creds `{keyId, keySecret}` → encrypt → status DRAFT |
| POST | `/api/v1/payment-gateway/config/:environment/verify` | Call provider `verifyCredentials()`; DRAFT→VERIFIED |
| POST | `/api/v1/payment-gateway/config/:environment/webhook-test` | Mark awaiting test event; UI polls status |
| PATCH | `/api/v1/payment-gateway/config` | Policy: `{allowPartial, minPartialAmount}`; env toggle `{currentEnvironment}` (requires target env ACTIVE) |
| DELETE | `/api/v1/payment-gateway/config/:environment` | Disable + soft-delete creds (audit-logged) |

### Checkout (Parent Portal — parent session; also CRM counter-assisted)
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/parent/v1/fees/invoices` | Payable invoices for linked kids `{balance, allowPartial, minPartial}` |
| POST | `/api/parent/v1/fees/invoices/:id/checkout` | `{amount}` → `{gatewayOrderId, providerOrderId, keyId, amount, currency, prefill}` — 409 if invoice not payable, 422 amount invalid, 403 gateway not ACTIVE |
| POST | `/api/parent/v1/fees/checkout/:gatewayOrderId/confirm` | `{providerPaymentId, providerOrderId, signature}` → provisional confirm; 400 on bad signature |
| GET | `/api/parent/v1/fees/payments` | Payment history + receipt download links |

### Webhooks (public, no session)
| Method | Path | Purpose |
|---|---|---|
| POST | `/api/webhooks/payments/razorpay/:orgId` | Fee-payment events for one org. Always 200 after event persisted; 401 bad signature; 400 malformed |

`orgId` in path → load that org's `PaymentGatewayConfig` → verify with **that org's** webhook secret. Existing `/api/webhooks/razorpay` stays for platform-subscription billing — separate concern, separate secret.

### Refunds & history (CRM)
| Method | Path | Purpose |
|---|---|---|
| POST | `/api/v1/fees/payments/:id/refund` | `{amount, reason}` — roles ORG_ADMIN, ACCOUNTANT; 422 amount > refundable |
| GET | `/api/v1/payment-gateway/transactions` | Paginated gateway orders + payments; filters: status, env, dates, student (uses `parseQuery` helpers) |
| GET | `/api/v1/payment-gateway/reconciliation` | Latest recon run results, mismatches |
| POST | `/api/v1/payment-gateway/reconciliation/run` | Manual trigger (rate-limited) |

### Cron (Vercel Cron, `CRON_SECRET` header-guarded)
- `GET /api/cron/payments-reconcile` — daily 02:00 IST
- `GET /api/cron/payments-expire-orders` — hourly; `CREATED/ATTEMPTED` past `expiresAt` → `EXPIRED`
- `GET /api/cron/payments-retry-webhooks` — every 15 min; reprocess `WebhookEvent` rows `FAILED` with `attempts < 5`

---

## 5. UI / UX Wireframes

### 5a. Settings → Payments (empty state, non-premium)
```
┌──────────────────────────────────────────────────────────────┐
│  Payments                                                    │
│                                                              │
│        [icon: credit-card]                                   │
│        Collect fees online                                   │
│        Let parents pay securely via UPI, cards and           │
│        netbanking — settled straight to your account.        │
│                                                              │
│        Available on the Premium plan.                        │
│        [ Upgrade to Premium ]   [ Learn more ]               │
└──────────────────────────────────────────────────────────────┘
```

### 5b. Setup wizard (premium, not configured)
```
┌──────────────────────────────────────────────────────────────┐
│  Set up online payments                    Step 2 of 4       │
│  ● Provider ── ● Credentials ── ○ Webhook ── ○ Policies      │
│                                                              │
│  Razorpay API keys (Test mode)          [Test ▼]             │
│  ┌────────────────────────────────────────────┐              │
│  │ Key ID       [rzp_test_____________]       │              │
│  │ Key Secret   [••••••••••••••••••••]  👁    │              │
│  └────────────────────────────────────────────┘              │
│  ⓘ Find these in Razorpay Dashboard → Account & Settings     │
│    → API Keys.  [Open Razorpay docs ↗]                       │
│                                                              │
│  ⚠ Keys are encrypted at rest and never shown again.         │
│                                                              │
│              [ Back ]        [ Verify & Continue ]           │
│  (on verify fail: inline red — "Razorpay rejected these      │
│   keys. Check you copied the Test-mode secret." )            │
└──────────────────────────────────────────────────────────────┘

Step 3 (Webhook):
│  Add this webhook in your Razorpay dashboard:                │
│  URL     https://app.vidhyaan.com/api/webhooks/…/{orgId} 📋  │
│  Secret  whsec_a8f3…  📋  (shown once)                       │
│  Events  payment.captured, payment.failed, refund.processed  │
│  Status  ◌ Waiting for test event…   [ I've added it ]       │
```

### 5c. Settings → Payments (configured)
```
┌──────────────────────────────────────────────────────────────┐
│  Payments                                    Razorpay  ✅    │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ Environment   ( Test | ● Live )                      │    │
│  │ Live keys     rzp_live_••••7XK2   Verified ✓ 12 Jun  │    │
│  │ Webhook       Healthy ✓ last event 4 min ago         │    │
│  │ [ Rotate keys ]  [ Disable payments ]                │    │
│  ├──────────────────────────────────────────────────────┤    │
│  │ Policies                                             │    │
│  │ [✓] Allow partial payments   Min amount [₹ 500  ]    │    │
│  └──────────────────────────────────────────────────────┘    │
│  KPI row: Collected this month ₹4.2L · Success rate 96% ·    │
│           Pending settlements ₹38k · Refunds ₹6k             │
└──────────────────────────────────────────────────────────────┘
```

### 5d. Parent Portal → Fees
```
┌───────────────────────────────┐   Payment sheet (Checkout):
│ Aarav — Grade 5B              │   ┌───────────────────────────┐
│ ┌───────────────────────────┐ │   │ Term 1 Fees  INV-2026-0142│
│ │ Term 1 Fees   ₹24,000     │ │   │ Balance          ₹14,000  │
│ │ Paid ₹10,000 · Due 15 Jul │ │   │ Pay  (●) Full  ₹14,000    │
│ │ ▓▓▓▓▓▓░░░░  PARTIALLY PAID│ │   │      (○) Other [₹     ]   │
│ │            [ Pay ₹14,000 ]│ │   │      min ₹500             │
│ └───────────────────────────┘ │   │ [   Pay securely  🔒   ]  │
│ History                       │   │ Powered by Razorpay       │
│ ✓ ₹10,000 · UPI · 02 Jun  📄 │   └───────────────────────────┘
└───────────────────────────────┘   → opens Razorpay Checkout.js
Success: ✓ animation, receipt number, [Download receipt PDF]
Pending-webhook state: "Payment received, confirming…" (poll 5s)
Failure: "Payment didn't go through — you have not been charged.
          [ Try again ]  [ Use different method ]"
```

### 5e. CRM Payment History / Transactions
```
┌──────────────────────────────────────────────────────────────┐
│ Transactions        [Env: Live ▼][Status ▼][Date ▼][Search]  │
│ DATE     STUDENT   INVOICE       AMOUNT  METHOD  STATUS   ⋮  │
│ 05 Jul   Aarav S   INV-…0142    ₹14,000  UPI     ✓ PAID  [⋮] │
│ 05 Jul   Diya P    INV-…0139     ₹8,000  Card    ↩ REFUND[⋮] │
│ 04 Jul   Rohan M   INV-…0135    ₹24,000  NetBk   ✗ FAILED[⋮] │
│ Row menu: View · Receipt PDF · Refund… · View webhook log    │
│ Refund modal: amount (≤ refundable), reason, confirm typed   │
└──────────────────────────────────────────────────────────────┘
```
Design system: existing tokens — table headers `text-[11px] font-bold uppercase tracking-wider`, badges `text-[11px] font-semibold`, primary `#1565D8`, cards `p-6`, sections `space-y-8`.

---

## 6. Backend Service Architecture

```
src/lib/payments/
├── index.ts                 // public surface: PaymentService only
├── service.ts               // PaymentService (orchestration, transactions)
├── provider.ts              // PaymentProvider interface + shared types
├── registry.ts              // getProvider(config) → concrete instance
├── vault.ts                 // CredentialVault: AES-256-GCM, key versions
├── webhook-processor.ts     // verify → dedupe → persist → apply
├── ledger.ts                // append-only LedgerEntry writer
├── receipts.ts              // receipt numbering (sequence-safe) + PDF hook
└── providers/
    ├── razorpay.ts          // ONLY file importing 'razorpay'
    └── mock.ts              // deterministic test double
```

### PaymentProvider interface (deliverable 15 — the abstraction)
```ts
export interface PaymentProvider {
  readonly slug: GatewayProvider

  verifyCredentials(creds: DecryptedCredentials): Promise<{ ok: boolean; error?: string }>

  createOrder(input: {
    amountMinor: number            // paise — integer at the boundary, Decimal inside
    currency: string
    receipt: string
    notes: Record<string, string>  // orgId, invoiceId, gatewayOrderId — audit trail
  }, creds: DecryptedCredentials): Promise<{ providerOrderId: string; raw: unknown }>

  verifyCheckoutSignature(input: {
    providerOrderId: string; providerPaymentId: string; signature: string
  }, creds: DecryptedCredentials): boolean

  verifyWebhookSignature(rawBody: string, signature: string, webhookSecret: string): boolean

  parseWebhook(rawBody: string): NormalizedGatewayEvent
  // NormalizedGatewayEvent: { providerEventId, type: 'payment.captured' |
  //   'payment.failed' | 'refund.processed' | 'refund.failed' | 'unknown',
  //   providerOrderId?, providerPaymentId?, providerRefundId?,
  //   amountMinor?, method?, errorCode?, errorReason?, occurredAt }

  createRefund(input: {
    providerPaymentId: string; amountMinor: number; notes: Record<string, string>
  }, creds: DecryptedCredentials): Promise<{ providerRefundId: string; status: 'pending' | 'processed' }>

  fetchPayments(input: { from: Date; to: Date; cursor?: string },
    creds: DecryptedCredentials): Promise<{ payments: NormalizedPayment[]; nextCursor?: string }>
}
```
Fee Management and all routes consume `NormalizedGatewayEvent`/`NormalizedPayment` — provider-specific payloads never cross the service boundary. Adding Cashfree = one new file + registry entry + enum value; zero fee-logic changes.

### PaymentService invariants
- Every state mutation runs in a single `prisma.$transaction` scoped with the tenant client (`forOrg`).
- `recordGatewayPayment` is idempotent: keyed on `(provider, providerPaymentId)`; re-application is a no-op returning the existing `Payment`.
- Money: `Decimal` rupees in DB (matches existing schema); convert to integer paise only inside providers. Never float.
- Invoice status transitions computed only by `fees.ts` (`sumSuccessfulPayments`, `remainingBalance`, `nextInvoiceStatus`) — extend with `refundedAmount` awareness; keep pure + unit-tested.

### CredentialVault (replaces legacy encrypt/decrypt)
- AES-256-**GCM** (authenticated) — legacy CBC has no integrity check.
- Dedicated `PAYMENT_ENCRYPTION_KEY` env (32 bytes, base64). **No fallback to `NEXTAUTH_SECRET`, no hard-coded default — throw at startup if absent.**
- Ciphertext format `v{keyVersion}:{iv}:{authTag}:{ciphertext}` → key rotation = add v2 key, re-encrypt lazily on next write, cron sweep for stragglers.
- Decrypted secrets live only in request scope; never logged, never serialized to responses, masked as `last4` in GETs.

---

## 7. Razorpay Integration Details

| Concern | Decision |
|---|---|
| Auth | Basic auth `key_id:key_secret` per org (Razorpay node SDK instance per request — SDK is a thin HTTP wrapper, no pooling concern) |
| Order | `POST /v1/orders` `{amount: paise, currency: 'INR', receipt: gatewayOrder.id, notes: {orgId, invoiceId, gatewayOrderId, studentId}}`. `notes` make every provider object traceable back to tenant rows |
| Checkout | Checkout.js on client with school's `key_id`, `order_id`, `prefill` (parent name/email/phone), school name + logo, theme `#1565D8` |
| Checkout signature | `HMAC_SHA256(order_id + "|" + payment_id, key_secret)` — timing-safe compare (pattern already in legacy code, keep) |
| Webhook signature | `HMAC_SHA256(rawBody, webhook_secret)` — **raw body only**; drop the legacy JSON.parse/stringify fallback (it accepts a second signature surface; unnecessary and weakens verification) |
| Events subscribed | `payment.captured`, `payment.failed`, `refund.processed`, `refund.failed`, `order.paid` (redundant safety net) |
| Idempotency out | Razorpay refund API accepts idempotency via unique `receipt`/reference in notes; we also guard with our own `Refund` row created before the API call |
| Amount rule | Order amount fixed at creation; partial payment = order for the partial amount (Razorpay full-capture per order), NOT partial capture |
| Test mode | `rzp_test_` keys against same endpoints; environment tracked on config + stamped on every `GatewayOrder` so test transactions can never contaminate live reporting |
| Rate limits | Razorpay ~ 1000 req/min per account; per-org keys mean per-school budget — platform-level throttling unnecessary; retry 429 with jittered backoff (max 3) in provider |
| Mock | `MockProvider` selected only via explicit `PAYMENT_PROVIDER_MOCK=1` in dev/test — **remove legacy behavior of silently mocking on 401 auth failures** (masks misconfiguration; in prod a school with bad keys would "succeed" with fake orders) |

---

## 8. Webhook Implementation & Verification Flow

```
POST /api/webhooks/payments/razorpay/{orgId}
  1. Read raw body (req.text()) BEFORE any parse.
  2. Load ACTIVE PaymentGatewayConfig for {orgId} + current env
       (decrypt webhook secret). None → 404 (don't leak org existence
       details, generic body).
  3. provider.verifyWebhookSignature(rawBody, x-razorpay-signature, secret)
       fail → persist WebhookEvent{signatureValid:false, SKIPPED} → 401.
       (Legacy route returned 200 on bad signature — do NOT copy; 401 is
       correct and Razorpay does not retry 4xx.)
  4. Idempotency, two layers:
       a. Redis SETNX webhook:{provider}:{eventId} TTL 48h — fast path.
       b. DB unique (provider, providerEventId) — durable backstop
          (Redis is best-effort per project convention).
       Duplicate → 200 {status:'duplicate'} immediately.
  5. Persist WebhookEvent RECEIVED (raw payload) — durable before any
       business mutation. If later steps crash, retry cron replays from here.
  6. Apply in one transaction (PaymentService.applyWebhookEvent):
       payment.captured →
         - find GatewayOrder by (provider, providerOrderId); verify
           order.orgId === {orgId} from path (cross-tenant guard);
         - verify amountMinor === order amount (mismatch → FAILED event,
           alert — never trust payload amount over our own record);
         - upsert Payment (SUCCESS, method from payload, gatewayRef,
           paidAt), GatewayOrder → PAID;
         - recompute invoice: paidAmount, nextInvoiceStatus();
         - LedgerEntry credit; AuditLog(PAYMENT_CAPTURED);
         - enqueue receipt email + parent notification (NotificationQueue —
           side effects outside the DB transaction, after commit).
       payment.failed → GatewayOrder ATTEMPTED w/ failureCode; no invoice
         change; optional parent notification.
       refund.processed → Refund PROCESSED; payment.refundedAmount +=;
         payment status REFUNDED/PARTIALLY_REFUNDED; invoice recompute;
         negative LedgerEntry; AuditLog.
  7. Mark WebhookEvent PROCESSED → 200.
  Failure in 6 → WebhookEvent FAILED (+error, attempts++) → 500 so
  Razorpay retries (24h backoff schedule); our retry cron is the second net.
Ordering: handlers tolerate out-of-order delivery (refund.processed before
payment.captured → park event FAILED for retry; captured arrives → next
retry succeeds).
```

---

## 9. State Machines

### GatewayOrder
```
CREATED ──payment attempt──► ATTEMPTED ──payment.captured──► PAID (terminal)
   │                            │
   │                            ├─payment.failed─► ATTEMPTED (stays; retry = new attempt on same order until expiry)
   ├────── expiresAt cron ──────┴──────────────► EXPIRED (terminal)
CREATED ──payment.captured──► PAID   (webhook may skip ATTEMPTED)
```

### Payment (extends existing enum semantics)
```
PENDING ──captured/confirmed──► SUCCESS ──refund(full)──► REFUNDED (terminal)
   │                               │
   │                               └─refund(partial)─► PARTIALLY_REFUNDED ─► REFUNDED
   └──failed──► FAILED (terminal)                       (further refunds until full)
Gateway payments are created directly as SUCCESS by the webhook apply;
PENDING remains for cheque/DD/NEFT manual flows (clearedAt semantics unchanged).
```

### Invoice (derived, never set directly — `nextInvoiceStatus()`)
```
SCHEDULED → UNPAID → PARTIALLY_PAID → PAID
              │            │            └─full refund──► REFUNDED
              │            └─refund below threshold──► PARTIALLY_PAID/UNPAID
              ├─past due date─► OVERDUE (display overlay; payments move it forward)
              └─admin waive──► WAIVED (terminal, audit-logged)
Rule: status = f(totalAmount, Σ successful payments − Σ refunds, dueDate, waived).
Single pure function; property-tested.
```

---

## 10. Error Handling & Edge Cases

| Case | Handling |
|---|---|
| Parent double-clicks Pay | Checkout endpoint rate-limited (existing `ratelimit.ts`, key `checkout:{parentId}:{invoiceId}`, 5/min); multiple `GatewayOrder`s are safe — only captured ones create Payments; extras expire |
| Two parents pay same invoice concurrently | Webhook apply transaction re-reads invoice `FOR UPDATE`; overpayment → capture recorded, excess flagged `ADJUSTMENT` ledger entry + admin alert (refund from UI); never silently dropped |
| Amount tampering client-side | Order amount fixed server-side at creation; webhook apply verifies payload amount against `GatewayOrder.amount` |
| Webhook before browser confirm | Fine — webhook is source of truth; confirm endpoint becomes read-through no-op |
| Browser confirm but webhook never arrives | Provisional SUCCESS marked `unconfirmed`; reconciliation cron + `lastWebhookAt` health flag surface it; recon fetches payment from API and settles |
| Duplicate webhooks | Redis SETNX + DB unique — apply is idempotent regardless |
| Webhook for unknown order | Persist event, status SKIPPED, alert — could be order created in Razorpay dashboard directly |
| Org downgraded from Premium mid-flight | Config auto-`DISABLED` on plan change hook; open orders still settle via webhook (money already in motion must reconcile); no NEW checkouts (403) |
| Credentials rotated at Razorpay end | Order creation starts failing 401 → config flagged `Needs attention` in settings + email to admin; no silent mock fallback |
| Refund exceeds refundable | 422 pre-check `amount ≤ payment.amount − refundedAmount` inside transaction |
| Razorpay 5xx / timeout on order create | Retry ×3 jittered backoff; still failing → 502 to client with friendly "try again" — no local rows leak (order row created only after provider success... actually: create local row first with status CREATED and no providerOrderId? No — create provider order first, then local row in txn; if local write fails after provider success, orphan provider order simply expires unpaid — harmless) |
| Clock skew / late `order.paid` after EXPIRED | Apply anyway (money is real): EXPIRED → PAID allowed transition in webhook apply, audit-logged |
| Partial below minimum | 422 with configured minimum echoed |
| Decimal/paise conversion | Single `toMinor/fromMinor` util pair, banker's-rounding-free (fees are ₹-precise; reject non-integer-paise amounts) |

---

## 11. Security Considerations

1. **Secrets at rest:** AES-256-GCM, dedicated key, versioned, fail-closed startup check. Secrets never in `Organization.settings` JSON (migrate out — §16), never in logs, masked in all reads.
2. **Webhook verification:** raw-body HMAC, timing-safe compare, per-org secret (compromise of one school ≠ platform-wide), 401 on failure, event persisted for forensics.
3. **Tenant isolation:** all reads/writes through `forOrg` client; webhook path double-checks `order.orgId === path orgId`; `@@unique([provider, providerOrderId])` prevents cross-tenant order collisions.
4. **RBAC:** settings write ORG_ADMIN only; refunds ORG_ADMIN + ACCOUNTANT; parents can only checkout invoices of students linked to their `Parent` record (existing parent-kid link check); platform SUPER_ADMIN can SUSPEND a config but never read secrets.
5. **Least privilege:** parent endpoints expose invoice balance + own payment history only; no key material ever reaches the client except public `key_id`.
6. **Audit:** every credential save/verify/rotate/toggle/disable, every refund, every manual reconciliation → `AuditLog` with actor, org, before/after (secrets redacted).
7. **No dev backdoors in prod:** mock provider behind explicit env flag + `NODE_ENV !== 'production'` hard guard; delete legacy auth-failure→mock fallbacks.
8. **PCI scope:** card data never touches Vidhyaan (Razorpay Checkout hosted fields) — SAQ-A posture; keep it that way (no custom card forms, ever).
9. **Rate limiting:** checkout, verify-credentials (5/hour/org — prevents using us as a key-validity oracle), refund endpoints.
10. **Idempotency + replay:** webhook dedupe as above; `WebhookEvent` payloads retained 90 days then pruned (job) — balance forensics vs data minimization.

---

## 12. Test Scenarios

**Unit (vitest, no network):**
- `fees.ts` extensions: `nextInvoiceStatus` × {payments, refunds, waive, overdue} matrix; property test: status monotonic under payment append.
- Vault: encrypt→decrypt roundtrip, tamper→throws (GCM auth), key-version routing, missing-env throws.
- `RazorpayProvider.verifyWebhookSignature` / `verifyCheckoutSignature` golden vectors.
- `parseWebhook` fixtures for all 5 event types + unknown.
- Paise conversion edge: `₹0.005` rejected, `₹24,000` → `2400000`.

**Integration (vitest + test DB, MockProvider):**
- Checkout → mock capture webhook → Payment SUCCESS, invoice PARTIALLY_PAID→PAID, ledger balance correct, receipt number unique under 50 concurrent creations.
- Duplicate webhook ×3 → exactly one Payment.
- Out-of-order refund-before-capture → parked then settled on retry.
- Cross-tenant: org B webhook carrying org A order → rejected, event SKIPPED, no mutation (extend existing tenant-isolation suite).
- Downgrade mid-checkout: config disabled → open order still settles, new checkout 403.
- Amount mismatch payload → FAILED event, no Payment.

**UAT script:**
1. Non-premium org: settings shows upsell, API 403.
2. Premium org: full wizard with real `rzp_test` keys; bad secret → inline error.
3. Razorpay test webhook → wizard step 3 turns green.
4. Parent pays full via test UPI (`success@razorpay`) → receipt PDF, invoice PAID, ledger row, admin sees transaction.
5. Partial pay below minimum blocked; valid partial → PARTIALLY_PAID.
6. Failed card (`fail` test card) → invoice unchanged, retry works.
7. Refund partial then full → statuses walk PARTIALLY_REFUNDED→REFUNDED, invoice recomputed.
8. Toggle TEST→LIVE blocked until live keys verified.
9. Kill webhook delivery (remove from RZP dashboard), pay → recon cron heals within a day; settings shows webhook-unhealthy warning.

---

## 13. Deployment Checklist

- [ ] `PAYMENT_ENCRYPTION_KEY` set in Vercel (prod + preview separately, different keys); app boot-fails without it.
- [ ] `CRON_SECRET` set; `vercel.json` crons added (reconcile daily, expire hourly, retry 15m) — functions stay in `sin1`.
- [ ] `npx prisma migrate deploy` — new tables + enum values (additive; enum additions are safe online in Postgres).
- [ ] Seed `payment-gateway` module row + attach to premium plans (`PlanModule`).
- [ ] Redis keys namespace `webhook:*` TTL sanity-checked in Upstash.
- [ ] Deploy to preview → run UAT script with `rzp_test` keys end-to-end including real Razorpay test webhooks (use preview URL in RZP dashboard).
- [ ] Feature flag `payment_gateway_enabled` (PlatformSettings) default OFF → deploy prod branch `vidhyaan-crm` → enable for one pilot school → 1 week soak → general enable.
- [ ] Dashboards/alerts: webhook failure rate, signature-failure count, recon mismatch count, order-create 4xx/5xx (Vercel log drains or Sentry).
- [ ] Runbook: how to SUSPEND a school's gateway, how to replay a WebhookEvent, how to rotate `PAYMENT_ENCRYPTION_KEY`.
- [ ] Legacy `createSchoolOrder` path removed/migrated (§16) before flag flips on.

## 14. Rollback Strategy

- **Kill switch first, rollback second:** flip `payment_gateway_enabled` OFF → all checkout endpoints 503-with-friendly-message; settings read-only. In-flight orders keep settling via webhooks (webhook route stays up under the flag — money in motion must always land).
- **Code rollback:** revert deploy on `vidhyaan-crm` (Vercel instant rollback). Migrations are additive-only by design — old code ignores new tables/columns; no down-migration needed. Never drop columns in the same release that adds them.
- **Data:** `WebhookEvent` is the durable inbox — anything mis-applied is replayable after fix (`payments-retry-webhooks` or manual replay endpoint). Ledger is append-only; corrections are compensating `ADJUSTMENT` entries, never row edits.
- **Per-school rollback:** SUSPEND single config (platform admin) without touching the flag.
- **Worst case (encryption key leak):** rotate key version, force re-entry of credentials (configs → DRAFT, admins re-verify), audit-log sweep, notify affected schools.

## 15. Future Extensibility (provider abstraction)

Already the spine of this design (§6). To add Cashfree/PayU/Stripe:
1. `providers/cashfree.ts` implementing `PaymentProvider` (~300 lines).
2. Enum value `CASHFREE` + registry entry.
3. Wizard provider step gains a card; provider-specific credential fields driven by a per-provider field descriptor (`{fields: [{key, label, mask}]}`) so the wizard UI is generic.
4. Webhook route is already `/[provider]/[orgId]` — parse + verify delegate to the provider.
Zero changes to Fee Management, invoice state machine, ledger, receipts, refund flow, or Parent Portal (Checkout launcher becomes a per-provider client component behind one `<PaymentButton provider=…>`).
Multi-provider-per-org (e.g., Razorpay for cards + institution bank UPI) is supported by the schema (`@@unique([orgId, provider, environment])`) — only the "which provider for this checkout" policy needs adding later.

## 16. Migration from Legacy Path

1. `src/lib/integrations/razorpay/index.ts` school functions (`createSchoolOrder`, settings-JSON creds) — freeze, then delete after cutover. Platform-subscription functions (`createSubscription`, `cancelSubscription`, platform `createOrder`) move to `src/lib/payments/platform-billing.ts` unchanged in behavior (separate concern).
2. One-off script: for each org with `settings.razorpayKeyIdEncrypted` → decrypt with legacy CBC → re-encrypt with GCM vault → create `PaymentGatewayConfig` DRAFT (admins must re-verify — we cannot verify webhook secrets we never had) → null the JSON fields.
3. Fix carried forward into the new webhook route, and backported to the legacy platform-billing webhook: **401 (not 200) on signature failure**, drop the stringify-fallback signature, add `WebhookEvent` idempotency.
4. Replace racy receipt-number generation in `invoices/[id]/pay/route.ts` with the shared sequence-safe generator from `payments/receipts.ts`.

---

## Implementation Order (suggested PRs)

1. **PR1 — foundation:** Prisma models + migration, vault, module seed, `PaymentProvider` interface + Razorpay & Mock providers, unit tests.
2. **PR2 — settings:** gateway config APIs + wizard UI + verify + webhook test.
3. **PR3 — checkout:** parent fee APIs, GatewayOrder, Checkout.js integration, confirm endpoint.
4. **PR4 — webhooks:** per-org route, WebhookProcessor, idempotency, invoice/ledger apply, receipt email.
5. **PR5 — refunds + history:** refund API/UI, transactions page, admin KPIs.
6. **PR6 — ops:** crons (reconcile/expire/retry), alerts, feature flag, legacy migration script, runbook.
