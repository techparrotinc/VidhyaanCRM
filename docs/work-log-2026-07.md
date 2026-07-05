# Vidhyaan CRM — Hardening & Performance Work Log (July 2026)

Record of a review + hardening + performance session. Production branch is
**`vidhyaan-crm`** (Vercel deploys track it); `main` is kept in sync.

---

## ✅ Done

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

## ⏳ Pending

1. **Subdomain-per-school** (phase 2) — `schoolname.vidhyaan.com`. Needs Vercel Pro +
   wildcard `*.vidhyaan.com` + NS. Safe to start steps 1–2 anytime (`Organization.subdomain`
   column + allocation + backfill); additive, no disruption if apex stays live + host-only cookies.
2. ~~**Tier-2 zod sweep**~~ — **DONE 2026-07-05** (see above).
3. **Lead bulk-action bar** — Assign/Change Status/Export/Delete buttons are no-ops; wire or remove.
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

---

## Key facts to remember
- **Production branch = `vidhyaan-crm`** (not `main`). Vercel tracks it.
- **Neon** is in Singapore (`ap-southeast-1`), scale-to-zero **off**; composite-index
  migration **already applied** to prod.
- **Vercel** functions pinned to `sin1` (Singapore), co-located with Neon.
- `npm test` = 46 vitest tests (tenant-isolation is integration, needs `DATABASE_URL`).
