# Vidhyaan CRM — Hardening & Performance Work Log (July 2026)

Record of a review + hardening + performance session. Production branch is
**`vidhyaan-crm`** (Vercel deploys track it); `main` is kept in sync.

---

## ✅ Done

### Reports — Phase-2 gaps closed (2026-07-09)
- **Marketplace Acquisition Funnel report** (15 reports total) — profile views → enquiries
  → CRM leads → converted, from `SchoolView`/`ParentEnquiry` linked via `School.orgId`;
  enquiry-status donut; proves whether the Vidhyaan profile sources admissions.
- **Ageing 5,000-row cap removed** — `computeAgeing` (`queries/ageing.ts`) pages the whole
  open book in 2k chunks and aggregates in memory (balance is a computed column, can't be
  a SQL filter). Used by defaulter-ageing summary + finance dashboard; no more silent
  undercount for large orgs.
- **90+ ageing MoM insight activated** — nightly rollup now snapshots
  `overdue_90plus_amount` (org-level, newest-day only, like `students_active`); finance
  dashboard compares live 90+ vs last month's snapshot and fires the deterioration alert.
  Accrues forward (needs ~a month of history before it can fire).
- **Fee Collection report is AY-aware** — invoices + rollups scoped by the Academic Year
  switcher (legacy null-AY rows show under every year). Defaulter/payment-register/
  concession stay calendar/current-state by design (current dues are AY-agnostic;
  concessions carry no AY stamp).
- **Campaign cost → ₹ ROI** — added `Campaign.costAmount` (migration); Campaign
  Effectiveness report shows Spend / Cost-per-Lead / Cost-per-Admission with an inline-
  editable Spend cell (`PATCH /reports/campaign-cost/[id]`); KPIs + insight report true
  cost per admission once spend is entered.
- **Bulk fee reminders from the Defaulter report** — "Send reminders" emails the
  FEE_INVOICE template to every filtered defaulter's guardian (one per student, capped
  200, audit-logged) via `POST /reports/r/defaulter-ageing/remind`, reusing the report's
  branch/grade/minAmount filters.
- **Dashboard refresh** — executive + finance dashboards get a refresh button that
  bypasses the Redis cache (`?fresh=1`), the pragmatic answer to 120s cache staleness.


### Reports — pre-sign-off bug fixes + feature gaps (2026-07-09)
**Bugs**
- **Defaulter Ageing dropped rows in pagination** (high — financial data loss). The rows
  query over-fetched `limit*3`, filtered by computed balance, sliced to `limit`, but
  advanced the cursor by `limit*3` — so ~⅔ of defaulters were silently skipped from
  "load more" AND from CSV/XLSX exports (the accountant's chase list). Fixed: fetch
  `limit`, advance cursor by raw fetch count; no rows skipped. Regression test drains all
  pages and asserts every defaulter appears exactly once.
- **Silent export truncation at 10k rows.** The export route ignored `drainRows`'
  `truncated` flag. Now marks the filename `_partial`, appends a TRUNCATED note to the
  rendered meta line (xlsx/pdf), sets `X-Report-Truncated`/`X-Report-Row-Count` headers,
  and records `truncated` in the export audit log.

**Feature gaps closed**
- **Branch filter for ORG_ADMIN.** New `effectiveBranchIds` resolver folds an optional
  `branch` selection into the role restriction (ORG_ADMIN narrows to the chosen branch;
  BRANCH_ADMIN can only narrow within branches they hold — never widens). Wired into
  `reportRequest` (as a scope selector, stripped from the filter bag) so all 9
  branch-aware reports honour it with zero per-module changes; also threaded through the
  executive + finance dashboards. New `branches` options source (platform-schema Branch,
  explicitly org-scoped). Filter bar + dashboard selector hide themselves for
  single-branch orgs.
- **Scheduled reports: test-send + delivery feedback.** Delivery logic extracted to
  `src/lib/reports/deliver.ts` (shared by cron + a new `POST /schedules/[id]/test` that
  sends an immediate `[TEST]` email to the owner's recipients). Added `lastRunAt`/
  `lastStatus`/`lastError` to `ReportSchedule` (migration); the Schedule popover shows
  last-run status per schedule and a "Send test" button with inline success/error.


### Reports made a universal feature — all orgs (2026-07-08)
- `advanced_reports` was plan-gated to growth/enterprise (2 of 18 orgs saw Reports).
  Made it universal: added the module to **every** plan (`free`/`starter` now included,
  in `prisma/seed.ts` + prod `billing.plan_modules`) so the billing reconcile/lifecycle
  jobs — which remap each org's modules to exactly its plan's set — never disable it again.
- Added `advanced_reports` to the hardcoded core-module lists in all org-creation paths
  (`onboarding/save`, `auth/school/{register,new,claim}`) so a brand-new org gets Reports
  immediately, before its first billing sync.
- One-off `scripts/enable-reports-all-orgs.ts`: added the missing plan-module rows and
  enabled the `OrganizationModule` for all 18 existing orgs (cache busted). Verified
  18/18 orgs, 4/4 plans.


### Reports & Analytics — schedules, trial conversion, widget customization (2026-07-08)
- **Scheduled email reports live** (14 reports total): `/api/v1/reports/schedules` CRUD
  (cadence tokens daily/weekly_*/monthly_1|15, ≤5 recipients, ≤10 schedules/user,
  optional saved-view filters); delivery cron `/api/cron/report-schedules` (02:30 UTC =
  08:00 IST) — **fail-closed re-checks per send**: org active, `advanced_reports` module
  enabled, creator's ACTIVE role assignment; runs with creator's row scoping. HTML email
  (KPI cards + insight + top-15 rows + deep link) via ZeptoMail; Schedule popover on
  every report page.
- **Trial Class Conversion report** — marketplace `TrialClassBooking` linked through
  `School.orgId` (claimed profiles); outcome via phone-match to CRM leads
  (ENROLLED/LEAD/NO_LEAD), per-activity conversion chart. Approximation stated in UI.
- **Executive dashboard widget customization** — show/hide + reorder via Customize
  popover; per-device localStorage prefs (`useWidgetPrefs`), unknown/new widget keys
  self-heal.
- Rollup backfill executed on prod (15 months, all orgs). Backfill rewritten
  **set-based** (`src/lib/reports/rollup-backfill.ts`): one SQL aggregate per metric
  across all orgs/days (GROUP BY org, IST day) — 1s vs the hours the original
  per-org-per-day loop took. Parity with the cron path pinned by
  `tests/reports-rollup-backfill.test.ts` (same fixture, both paths, identical rows).
- Fixed pre-existing lint error in `AiSidebar.tsx` (`<a>` → `next/link`).

### Reports & Analytics — institution-type + role enhancements (2026-07-08)
- **3 new reports (13 total)**: `course-performance` (LC/coaching lens — enrollments,
  batch fill, monthly run-rate, per-course billed/collected via `invoice.courseId`),
  `daily-activity` (front-desk ops log from `LeadActivity`; COUNSELLOR sees own),
  `payment-register` (accountant reconciliation — cash vs digital split, collector
  column, defaults to today). `Course`/`CourseEnrollment` added to `forOrg` tenant list.
- **Institution-aware executive dashboard** — course-led org types
  (LEARNING_CENTER/COACHING_CENTER/SKILL_DEVELOPMENT/SPORTS_ACADEMY) get
  enrollments-by-course + batch-fill widgets instead of grade capacity; response
  carries `institutionType`/`courseLed`.
- **UI pass** — KpiCard icons + colour tones (top accent bar + tinted icon chip),
  categorical donut palette, stage-coloured funnel (converted green / lost red),
  lead-source share donut on executive, Library page now tabbed by category
  (All / Admissions / Fees & Finance / Team / Students / Courses & Batches / Campaigns).
- COUNSELLOR granted lead-funnel (scoped to own leads via `leadBaseWhere`).

### Reports & Analytics module — Phase 1 (2026-07-08)
Full build per [reports-analytics-phase1-prd.md](reports-analytics-phase1-prd.md); all 4 sprints.
- **Data layer** — new `reporting` Postgres schema (migration `20260707182911_reporting_phase1`):
  `daily_rollups` (nightly per-day aggregates, delete-then-insert idempotent, **IST day
  boundaries**), `report_saved_views`, `report_usage` (favourite+recency), `report_schedules`
  (Phase 2 placeholder). Hot-path indexes: `leads(orgId,source,status)`,
  `leads(orgId,nextFollowUpAt)`, `invoices(orgId,status,dueDate)`. All 4 models in `forOrg`.
- **Rollup pipeline** — `src/lib/reports/rollup.ts` (9 metrics; snapshot metric
  `students_active` only written for yesterday); cron `/api/cron/reports-rollup`
  (01:30 IST, trailing 3-day self-heal, per-org error isolation) in `vercel.json`;
  backfill `scripts/backfill-report-rollups.ts` (**not yet run on prod — trend charts
  empty until it runs or cron accumulates**).
- **3 dashboards** — `/reports/executive` (5 KPIs w/ true YoY vs previous AY, funnel w/ LY
  ghost, fee trend from rollups, source conversion, capacity heat, attention strip),
  `/reports/my-desk` (counsellor work queue: overdue/today/gone-cold + `CounsellorTarget`
  attainment + median response vs team), `/reports/finance` (MTD KPIs, ageing buckets,
  method mix, today's receipts). Role-based landing at `/reports`.
- **10 reports** — registry-driven (`src/lib/reports/registry.ts` = single source: roles,
  filters, exports). Query modules in `src/lib/reports/queries/*` implement
  `summary/rows`; generic routes `/api/v1/reports/r/[reportKey]/{summary,rows,export}`
  dispatch by key. Reports: lead-funnel, lead-source-effectiveness (low-sample badges),
  counsellor-performance (source-mix fairness col), follow-up-discipline,
  admission-pipeline (stage ageing + capacity), fee-collection-summary (rollup trend),
  defaulter-ageing (bucket→dueDate window), concession-audit (₹ vs % types kept separate),
  campaign-effectiveness (14-day source attribution; credits via ledger `ref=campaignId`),
  enrollment-strength (grade movement + LC batch data).
- **Engine surfaces** — Library page (`/reports/library`: category cards, favourites,
  recents, search), generic report page (`/reports/r/[slug]`: filter bar from config,
  saved views CRUD, star, insight sentence, chart-by-slug, cursor-paginated table),
  exports CSV (streamed), XLSX (exceljs), PDF (react-pdf generic template for
  fee-summary/defaulter/enrollment) — every export writes an `AuditLog` EXPORT row
  (guardian-phone data). Row scoping single choke point (`queries/scope.ts` +
  `leadBaseWhere`): COUNSELLOR → own leads, BRANCH_ADMIN → `UserBranchAccess` branches.
- **Caching** — exec/finance dashboards 120s, report summaries 300s (key = filter+scope
  hash so counsellor numbers never leak into admin cache); rows/exports uncached.
- **Module gate** — existing `advanced_reports` slug (already on growth/enterprise plans);
  sidebar item already existed.
- **Deps added**: recharts, exceljs. **Tests**: 178 passing (rollup correctness/idempotency,
  query-module integration incl. role scoping, insight rules, CSV/drain, registry parity).


### Security / correctness
- **Tenant isolation hardened** — `forOrg()` (`src/lib/db/tenant.ts`) rewritten as a
  fail-closed `$allOperations` switch. `count/aggregate/groupBy/upsert/findFirstOrThrow/
  findUniqueOrThrow` now `orgId`-scoped (previously ran cross-tenant); unknown ops throw.
- **Identity-header spoofing closed** — middleware strips inbound `x-user-*`/`x-org-id`
  headers on every path before setting them from the verified session.
- **Payment fail-closed** — `verifyPayment` rejects when `RAZORPAY_KEY_SECRET` unset (was
  falling back to the literal `'mock_secret'`); webhook 503s without its secret;
  `timingSafeEqual` comparisons; `billing/verify` body zod-validated.
- **Public enquiry** — zod caps, source whitelist, removed a debug log leaking parent PII.

### API framework
- **Query-param validation** — `src/lib/api/query.ts` (`parseQuery`, `enumParam`,
  `paginationShape`, `asEnum`); central `ZodError → 422` in `respond.ts`. Applied to
  leads/students/campaigns/admissions/fees/admin-orgs and NaN-proofed pagination on ~8 routes.
- **Parent/admin bodies zod-validated** — kids, profile, school-profile fees/facilities,
  admin plans/[id] + organizations/[id] (fixed `NaN`-to-Decimal writes).

### Fee math
- **`src/lib/fees.ts`** — pure paise-rounded helpers (`sumSuccessfulPayments`,
  `remainingBalance`, `nextInvoiceStatus`, `sumLineItems`, `resolveScheduleStatus`); pay
  + invoice routes use them instead of inline math.

### Tests
- **vitest, 46 tests** (`npm test`) — tenant isolation (integration, seeds 2 throwaway
  orgs), fee-math invariants, rate limiter race-safety, query helpers.

### Tier-2 zod sweep (2026-07-05)
- Body validation added to all remaining mutating routes that read a body (~30 files):
  school-profile (profile/media/hours), files/upload (**also added missing auth — was
  fully unauthenticated — plus 10MB size cap + extension whitelist**), fees/invoices/[id],
  admissions/[id] (**replaced blocklist destructure with whitelist schema — mass-assignment
  closed**), enrollments, settings/security (discriminated union on `action`),
  notifications, onboarding/save (full step-payload schema), billing/subscribe,
  parent/bookmarks, auth (otp/verify, pin set/verify/reset/generate-reset-token,
  school claim/register/new/verify-email), admin (settings, notify, impersonate,
  schools approve/reject, scraping/import, parents/[id]), public (trial, visit).
- Remaining flagged routes read no body (param-only mutations, signature-verified
  webhooks) — nothing to validate.

### Refactors (page splits)
- admission-management 3272→1405, lead-management 2351→899, schools/[slug] 2250→1812,
  settings/school-profile 1913→1570.
- New component dirs: `components/admissions/` (11), `components/leads/` (9),
  `components/marketplace/` + `components/marketplace/school-profile/`,
  `components/settings/school-profile/`.
- Fixed a real bug: schools/[slug] review modal wrote to `enquiryForm.parentName`.

### Performance (this was the big win)
- **Root cause of prod slowness: cross-region latency.** Vercel ran in `iad1` (US East),
  Neon in `ap-southeast-1` (Singapore) → ~450ms per DB round-trip, stacking into seconds.
  **Fixed by co-locating: `vercel.json` regions `["sin1"]` + Neon scale-to-zero disabled.**
- **Composite `(org_id, …)` indexes** on hot tenant tables (Lead/Admission/Student/Invoice/
  Payment/Notification/activities) — migration applied to Neon prod.
- **`route()` per-request lookups batched** — revocation×2 + org + module + academic-year
  now one `Promise.all` instead of 5 sequential Redis calls.
- **Onboarding guard → session flag** — `onboardingComplete` in the JWT; middleware skips
  the per-navigation self-fetch (was a 6-join query on every CRM page) for onboarded orgs.
- **Fee list over-fetch removed** (dropped `items`+`payments` includes); leads cap count
  folded into `Promise.all`.
- **Dashboard** — real `loading.tsx` skeleton (was `null`); summary cache TTL 60s→300s.

### Multi-tenancy / DB architecture (decisions)
- Confirmed **shared-schema + `orgId` row-level tenancy** is correct for 1000s of schools —
  do NOT move to schema-per-school. Neon pooler + directUrl already correct.
- **Subdomain-per-school feature**: fully planned, **parked to phase 2** (post market-fit).

---

### Event Management module — Phase 1 (2026-07-05)
- **Schema**: `Event.type/capacity/isPublished` + `(org_id, starts_at)` index —
  migration `20260705140644_event_type_capacity_published` **created but NOT applied**
  (`npx prisma migrate deploy` needed before this ships).
- **Module**: `event_management` slug (core/free) — added to MODULES, seed, all 4 signup
  core lists; `scripts/backfill-event-module.ts` enables it for existing orgs (run once on prod).
- **API**: `/api/v1/events` (list w/ scope/month/type/search + create),
  `/api/v1/events/[id]` (detail w/ resolved attendee names + rsvpCounts, update, soft delete),
  `/api/v1/events/[id]/rsvps` (add w/ org-checked attendee + capacity guard, status update, remove).
- **UI**: full page (list + month calendar toggle), create/edit drawer (school + center
  event types), detail drawer with RSVP tab (lead search → invite, mark attended).
- **Dashboard**: fake "Recent Notifications" card replaced with real Upcoming Events
  (next 3 via summary API).
- **Phase 2 parked**: publish to marketplace profile + public RSVP→lead, campaign
  invites, reminders, ICS.

### Event Management — UX redesign + lifecycle (2026-07-05, later)
- **Drawers killed** → full pages: `/event-management/new`, `/[id]` (hero + Overview/
  Attendees tabs), `/[id]/edit`.
- **Lifecycle**: `EventStatus` enum DRAFT→PUBLISHED→CANCELLED. Drafts editable/deletable;
  publish locks (server-side PUT/DELETE 409 + UI banner); cancel = only exit. RSVPs only
  on published. Migration `20260705144814_event_status_lifecycle` — **applied? user runs
  `npx prisma migrate deploy`** (additive).
- **Metrics strip** on list: upcoming, drafts, upcoming RSVPs, 90-day attendance rate
  (`/api/v1/events/metrics`). List rows: status badge, capacity fill bar, filters
  (status/type/search).
- Dashboard upcoming card now shows **published only**.

### Backlog sweep (2026-07-06)
- **Lead bulk-action bar wired** — `POST /api/v1/leads/bulk` (assign/status/delete,
  org-verified, soft delete); bar has counsellor/status menus, client CSV export, confirm delete.
- **Dashboard fakes eliminated** — month-over-month comparisons (enquiries/converted/avg
  convert days from `decidedAt`), fee % vs last month, leads today, admitted this month.
  "Converted" uses `updatedAt` as transition proxy (no status-change timestamp stored).
  "Leads This Month" now true intake (was status=NEW only). Removed "Interview pending: 2".
- **school-profile page split done** — Basic/Contact/Academics/Gallery extracted
  (1570→~990 lines); all 8 tabs now components.
- **Partial soft-delete indexes applied** — hand-written migration
  `20260706040000_partial_soft_delete_indexes`: `(org_id, created_at) WHERE deleted_at
  IS NULL` on leads/admissions/students/campaigns, `(org_id, due_date)` invoices,
  `(org_id, starts_at)` events. Not representable in schema.prisma — drift warnings
  from `migrate dev` expected.
- **Read replica / RLS — deliberate defer**: replica needs Neon read-replica endpoint +
  a second Prisma client for report routes — revisit when report queries measurably
  degrade primary. RLS is a second isolation net under `forOrg()`; needs session GUC
  (`SET app.org_id`) per pooled connection — revisit at >500 orgs or first tenant-leak
  near-miss.
- **next-auth v5**: still beta (`beta.31`, which is what we run; `latest` remains v4).
  Nothing to do until GA.

### 2026-07-06 evening → 07-07 morning (19 commits, `061c697..83241f7`)

**Fee & student UX pass (07-06 evening)**
- Student detail → tabbed view (Overview + **Invoices + Payments** tabs,
  `StudentInvoicesTab`/`StudentPaymentsTab` components); student edit page restyled to
  lead-edit design parity.
- Create-invoice wizard: 3-step with stepper → Details+Fee Items merged into one step;
  **fix: adhoc invoices from the wizard actually generate** (were silently dropped).
  Invoice detail page rebuilt full-width 3-column.
- Parent portal fees: invoices **grouped by institution** for multi-org parents +
  term/period grouped views with subtotals.

**Unified login (07-07 morning)**
- One login flow with a **workspace picker** for multi-role users (same phone as
  org admin + parent etc.) — `beaae68`.

**Messaging credits add-on (SMS/WhatsApp) — full slice**
- Schema + engine: `MessageWallet` (free allowance 25/channel + purchased balance),
  `MessageCreditLedger`, `MessagingProviderConfig` (BYO MSG91, vault-encrypted authKey);
  `src/lib/credits/` — `engine.ts` (spend/refund/grant), `provider.ts`,
  `metered-send.ts` (**the entry point for org-attributed SMS/WhatsApp**; BYO creds
  first, else 1 credit/message, throws `InsufficientCreditsError` at zero).
- Credit-pack purchase via Razorpay (order → verify → webhook, fail-closed).
- Campaign sends metered against wallets; platform admin can adjust free allowances.
- Settings → **Add-ons** UI: wallet KPIs, purchase packs, BYO provider config + ledger.

**Settings shell redesign**
- Grouped nav + card-grid landing (`src/components/settings/settingsNav.ts` is the
  single nav source — new settings pages register there).

**Leads**
- Convert-to-admission fix + status dropdown hardening (`14dc32e`).

**WhatsApp template catalog**
- `WhatsappTemplate` with positional `{{1}}..{{n}}` params + campaign FK
  (migration `whatsapp_template_structure`); **platform admin shared catalog** with
  per-org copies (`/admin/whatsapp-templates`); org settings page with tabbed UI,
  BYO manual template entry, test-send, and sync. Campaign WhatsApp sends resolve
  the approved template's name/language and build positional params.

### 2026-07-07 — big feature day (12 commits, `83241f7..7b9e77f`)

**Fixes & hardening**
- **Admission stages auto-seeded for every new org** — all 5 org-creation paths call
  `createDefaultAdmissionStages` (8 stages); backfill ran against prod (87 orgs).
  Root cause of "AGM Global School has no pipeline".
- **Prod checkout vault failure** — Vercel `PAYMENT_ENCRYPTION_KEY` differed from local;
  since local+prod **share one Neon DB**, secrets encrypted locally failed prod GCM auth.
  Fixed by syncing the env var (prod+preview) + redeploy. **Rule: any encryption/secret
  env must be identical in `.env.local` and Vercel** (see memory: shared-db-env-parity).
- **Code generation collision class killed** — lead codes, admission student codes and
  invoice numbers all used `count()+1`, which collides after soft deletes and on
  non-numeric legacy codes (`LD-2026-SEED-00007` broke string-max). All moved to
  SQL numeric-max over strictly-formatted codes + P2002 retry
  (`src/lib/lead-code.ts`, `src/lib/invoice-number.ts`, convert route).
- **Marketplace enquiry dedupe per child** — 24h/48h guards now key on
  school+phone+childName+grade (was school+phone), so a second child can enquire same day.
- **Profile completion single source** — dashboard had hardcoded `100`; two formulas
  fought over `School.profileCompletion`. `school-profile-helper` checklist formula is
  now canonical everywhere; all 87 schools recalculated.
- **Dashboard demo-data purge** — lead overview (3/8/14, source chips, unassigned nudge),
  fee overview (YTD, last payment, student paid/overdue/due-soon split, oldest overdue)
  all real + AY-scoped now. Fetch race guards added (stale response can't overwrite).
- **Academic-year switcher is real** — was a hardcoded dropdown wired to nothing.
  Now: zustand-persisted store (`stores/academic-year.store.ts`) fed by real years;
  consumed by dashboard summary, leads, admissions (list+pipeline+stage tabs),
  students (list + detail invoices tab), fee management (list+KPIs). Legacy rows with
  null AY appear under every year (AND-wrapped so search ORs still work).
- **Duplicate academic-year names** → clean 400 with message (was raw P2002 500).

**Features**
- **Setup checklist** (`/setup`) — 9 live-computed steps (profile, academic year,
  pipeline, fees/courses, data import, gateway, WhatsApp, SMS, team) with skip support
  in `org.settings.setup`; dashboard banner for paid/trialing orgs; sidebar link until 100%.
- **Admission archive** — `Event`-style lifecycle for ADMITTED records: `archivedAt`
  column, archive/restore API + list toggle. Admitted can't be deleted (anchors student
  records/reports); archive hides from active views. Delete errors surface real reasons.
- **Year-end student movement** (`/student-management/promote`) — 3-step wizard:
  per-student Promote/Retain/Alumni, `Student.section` (new column, finally persisted
  from convert flow), target AY/class/section, fee-plan line-item tweaks per batch,
  batch invoice generation (decoupled from the move — billing failure never rolls back).
- **App-level ConfirmDialog** (`components/ui/confirm-dialog.tsx`) — replaced all
  `window.confirm` in lead/admission/fee/student/event surfaces. Student bulk delete
  (ORG_ADMIN only, cascade warning). Settings pages still on native confirm.
- **Event redesign** — real S3 uploads (`lib/storage.ts`, bucket `vidhyaan`,
  `ap-south-1`, per-module folders `uploads/{orgId}/{events|admissions|...}`; the old
  route faked URLs); branded `DateTimePicker` component (replaces datetime-local);
  cover image on form/list/detail/parent portal/announce email; Save & Publish one-click
  flow → announce modal auto-opens (`?announce=1`); Announce modal with live recipient
  counts, per-class parent filter, hand-picked people (server resolves contacts),
  capacity warning, channels: portal (free) / email (free) / SMS (metered wallet or BYO);
  `EventAnnouncement` audit table. WhatsApp deferred (needs approved template — Campaigns).
  Parent portal **Events tab** with RSVP (capacity-checked).
- **Email Templates settings** (`/settings/email-templates`) — 8 org-customizable
  emails (fee invoice, event announce/cancel, enquiry confirmation, lead ack,
  interview scheduled, admission confirmed, student welcome) with variable chips,
  sample preview, reset-to-default. `OrgEmailTemplate` table; defaults in
  `lib/mail/org-templates.ts`; bodies render inside branded shell. Four sends are NEW
  (lead ack, interview-stage move, admitted transition, convert welcome) — all
  fire-and-forget. Platform emails (OTP/registration/billing) deliberately locked.
- **Notification prefs** — new events category (RSVP received / event cancelled) +
  lead-converted, with real emitters. Pre-existing rows without emitters
  (DOCUMENT_UPLOADED, INTERVIEW_REMINDER, FEE_REMINDER) still unwired.

**Infra**
- AWS S3: bucket `vidhyaan` (ap-south-1), IAM user `vidhyaan-crm-aws-storage`,
  public-read policy on `uploads/*` only; env `AWS_*`/`S3_BUCKET_NAME` in `.env.local`
  + Vercel prod/preview. `@aws-sdk/client-s3` added.
- Migrations applied to shared DB same-day: `admission_archived_at`, `student_section`,
  `event_image_announce`, `org_email_templates`.


**Billing & Pricing system (2026-07-08, full build)**
- Strategy: docs/pricing-strategy-2026.md (4 plans × 5 student slabs, launch offers,
  yearly default, break-even model). Plans renamed in DB (slugs unchanged): free =
  "School / LC Listing", starter = "CRM Package", growth = "Fee Management", enterprise.
- Schema (migrations applied to prod): `plan_prices` (slab pricing + `launch_ends_at`),
  `coupons` + `coupon_redemptions`, platform_settings columns `enabled_billing_cycles`,
  `prices_include_gst`, business seller details.
- Checkout: full-page `/settings/billing/upgrade` (plan grid → Teachmint-style order
  summary), slab picker (server-validated ≥ detected), GST breakup incl./excl. modes,
  Razorpay Invoices API (Bill-To on `comment`, seller GSTIN on `terms`), coupons,
  per-org discount (settings.billingDiscountPct, cap 50%), proration (upgrade = credit,
  downgrade = scheduled at period end), no-refund disclosure at 4 touchpoints.
- Lifecycle: daily cron `/api/cron/billing` — reconcile sweep (paid-but-unactivated,
  incl. failed-then-retried orders; 10-day window), T−7/3/1 reminders **with hosted
  renewal payment links** (early payment extends from period end), 7-day grace →
  expiry downgrade + module lockout, slab-overflow warnings, 1000+ custom-quote ops
  alert. Trial = full Enterprise modules; trial cron locks to free at expiry.
- Free tier enforced: 2 users / 25 students (lib/billing/limits.ts).
- Bundled AI credits (100–500/mo by slab) granted on activation via wallet allowance.
- Admin: /admin/pricing (metrics, projections, coupon manager, live ARPU), slab editor
  w/ launch expiry, per-org discount field, comp plan changes create ₹0 subscriptions,
  real revenue dashboards, refund webhook → REFUNDED + ops alert.
- Impersonation redemption finished: `/impersonate?token=` + 30-min sessions + CRM banner.
- Settings UX: index = card grid + search (sidebar only on subpages); School Profile
  billing-details tab (Bill-To + GSTIN). Public /pricing rewritten — features only,
  no prices revealed.
- Money math extracted to lib/billing/money.ts; tests/billing-math.test.ts (212 total).
- Key invariant: `payment.failed` webhook must NOT overwrite gatewayRef (order id
  needed for retry reconciliation).

## ⏳ Pending
0. **Reports Phase 2** — rollup backfill on prod (script ready); scheduled email reports
   (`report_schedules` table shipped); marketplace analytics; 90+ ageing MoM insight
   (needs ageing snapshot metric in rollups); mutation-driven cache invalidation;
   bulk fee-reminder action from defaulter report.

1. **Subdomain-per-school** (phase 2) — `schoolname.vidhyaan.com`. Needs Vercel Pro +
   wildcard `*.vidhyaan.com` + NS. Safe to start steps 1–2 anytime (`Organization.subdomain`
   column + allocation + backfill); additive, no disruption if apex stays live + host-only cookies.
2. ~~**Tier-2 zod sweep**~~ — **DONE 2026-07-05** (see above).
3. ~~**Lead bulk-action bar**~~ — **DONE 2026-07-06** (see backlog sweep above).
4. ~~**Dashboard "Profile Views"**~~ — **DONE 2026-07-05**: wired to `School.viewCount`
   + `SchoolView` 7-day count via summary API; full-page loading skeleton kills the
   0-then-value flash. **Still fake**: "This Month vs Last Month" chips (26/+44%,
   17/+54%, avg convert) and KPI trend strings ("+3 today", "+8% vs last month",
   "+5% this month") are hardcoded — wire or drop in a later pass.
5. **settings/school-profile** — Basic/Contact/Academics/Gallery tabs still inline (Gallery
   has upload logic; heaviest). Other tabs already extracted.
6. **Scale-time only**: partial soft-delete indexes (`WHERE deleted_at IS NULL`), read
   replica for reports, Postgres RLS as a second isolation layer.
7. **next-auth v5 beta** pin — migrate at GA.
8. **Optional India latency**: move both to Mumbai (Neon `ap-south-1` + Vercel `bom1`) —
   needs Neon data migration; not worth it now (Singapore co-located is fine).
9. **WhatsApp event announcements** — needs wiring to the approved-template catalog
   (whatsapp-templates feature); announce modal points to Campaigns meanwhile.
10. **Notification emitters missing** — DOCUMENT_UPLOADED, INTERVIEW_REMINDER,
   FEE_REMINDER have preference rows but nothing fires them.
11. **Fee dues carry-forward** — promoted students' unpaid balances only visible under
   the old academic year; flagged during year-end movement build.
12. **Orphaned S3 uploads** — replaced/abandoned cover images are never deleted;
   periodic cleanup of unreferenced `uploads/**` objects.
13. **Settings pages still on `window.confirm`** — migrate to the shared ConfirmDialog
   (core CRM surfaces done 2026-07-07).
14. **Dashboard AY scoping leftovers** — profile views / events / recent activity
   deliberately unscoped (not year-bound); revisit if users expect otherwise.

---

## Key facts to remember
- **Production branch = `vidhyaan-crm`** (not `main`). Vercel tracks it.
- **Neon** is in Singapore (`ap-southeast-1`), scale-to-zero **off**; composite-index
  migration **already applied** to prod.
- **Vercel** functions pinned to `sin1` (Singapore), co-located with Neon.
- `npm test` = 46 vitest tests (tenant-isolation is integration, needs `DATABASE_URL`).
