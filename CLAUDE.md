# Vidhyaan CRM Dashboard - Project Context & Developer Guidelines

This document serves as the single source of truth for design patterns, technology stack details, build commands, and layout specifications for the Vidhyaan School Admin Portal.

---

## 💬 Developer Communication preference
- **Communication Style**: Always speak in **caveman** mode (`full` intensity). Keep replies terse, remove articles, keep code exact.

---

## 🛠️ Build and Development Commands
- **Run Local Dev Server**: `npm run dev` (Runs Next.js 15 with Turbopack on http://localhost:3000)
- **Verify Production Compile**: `npm run build`
- **Verify Linter**: `npm run lint`
- **Run Tests**: `npm test` (vitest — DB-backed suites need `TEST_DATABASE_URL` = disposable Neon branch; without it they are skipped and can never touch the shared prod DB)
- **Automated Verification & Docs Update**: `python3 scripts/verify_project.py` (Compiles, verifies build health, and autogenerates status metadata below)

---

## 🚀 Deployment & Infrastructure
- **Production branch**: **`vidhyaan-crm`** (NOT `main` — Vercel production deploys track it; `main` is kept in sync).
- **Host**: Vercel, functions pinned to **`sin1` (Singapore)** via `vercel.json` `regions`.
- **Database**: Neon Postgres in **`ap-southeast-1` (Singapore)** — co-located with Vercel (this is critical; a mismatched region added ~450ms per query). **Scale-to-zero disabled** on the prod branch to avoid cold starts.
- **Cache/rate-limit/revocation**: Upstash Redis (REST) — configured in Vercel env (`UPSTASH_REDIS_REST_URL/_TOKEN`); local dev falls back to an in-memory mock.
- **Migrations**: `npx prisma migrate deploy` (uses `DIRECT_URL`). Composite tenant indexes are applied to prod.
- **Recent work + pending backlog**: see [docs/work-log-2026-07.md](file:///Users/vimaldas/Projects/VidhyaanCRM/docs/work-log-2026-07.md).

---

## 📂 Project Architecture & Codebase Pointers
- **Main View Viewport**: [page.tsx](file:///Users/vimaldas/Projects/VidhyaanCRM/src/app/dashboard/page.tsx)
  Contains all layout structures, card divisions, Quick Actions, and custom Tailwind styling.
- **Custom UI Adjustments**:
  - [progress.tsx](file:///Users/vimaldas/Projects/VidhyaanCRM/src/components/ui/progress.tsx): Extended Shadcn `Progress` component with `indicatorClassName` support. Enables applying `#1565D8` primary blue fills to progress indicator elements.
- **Global Styles & Configurations**:
  - [globals.css](file:///Users/vimaldas/Projects/VidhyaanCRM/src/app/globals.css): Declares import paths, variables, inline `@theme` setups, and standard fonts quality rendering parameters.

---

## 🎨 Design System & Typography Specs
Ensure all custom typography inherits this official Vidhyaan typography scheme.

### Font Definitions
- **Primary Stack**: `'CircularXXWeb', 'Poppins', 'ABC Diatype', system-ui, sans-serif`
- **Fallback Stack**: `'Poppins', system-ui, sans-serif`
- **Quality Settings**: Antialiased font rendering is locked globally on the `body` tag.

### Typography Scale Mappings
Use these Tailwind equivalents throughout the JSX configurations:
- **KPI Values**: `text-[32px] font-bold tracking-tight text-slate-900 leading-none`
- **Page Titles**: `text-2xl font-bold tracking-tight text-slate-900`
- **Welcome Title**: `text-xl font-bold tracking-tight text-slate-900`
- **Section Titles (Headers)**: `text-[11px] font-bold uppercase tracking-widest text-slate-500`
- **Nav Links**: `text-sm font-medium` (Active: `font-semibold text-[#1565D8]`)
- **Table Headers**: `text-[11px] font-bold uppercase tracking-wider`
- **Table Body Text**: `text-sm font-normal leading-relaxed`
- **Badge Elements**: `text-[11px] font-semibold`
- **Description Copy**: `text-sm font-normal leading-relaxed text-slate-500`
- **CTA Links**: `text-sm font-semibold text-[#1565D8]`
- **Meta/Timestamps**: `text-xs font-normal text-slate-400`
- **Standard Button Label**: `text-sm font-semibold`
- **Footer CTA Headline**: `text-[22px] font-bold tracking-tight text-white`
- **Banner Alerts**: `text-sm font-medium`

### Core Layout Parameters
- **Main View Background**: `#F8FAFC` (light slate, styled using `bg-brand-bg` class)
- **Layout Spacers**: `space-y-8` (32px padding gap) between all major sections.
- **Minimum Card Padding**: `p-6` (24px) for all content container elements.

---

## ✅ Implemented Modules
Feature history lives in git log — this is a capability map only.

*   **Data layer**: 128 Prisma models across 5 PostgreSQL schemas (`platform`, `crm`, `billing`, `marketplace`, `reporting`); tenant isolation + soft delete via fail-closed `$extends` client in [src/lib/db/tenant.ts](file:///Users/vimaldas/Projects/VidhyaanCRM/src/lib/db/tenant.ts). **Any new model queried via the tenant `db` client MUST be registered in `TENANT_MODELS` (+ `SOFT_DELETE_MODELS` if it has `deletedAt`) — the extension is fail-OPEN for unlisted models (skips `orgId` injection → cross-tenant reads).**
*   **Auth**: NextAuth v5 OTP + PIN login, role-gated middleware (platform/org/parent roles), identity headers stripped and re-set per request, Redis-backed revocation.
*   **API framework**: `route()` composer in [src/lib/api/compose.ts](file:///Users/vimaldas/Projects/VidhyaanCRM/src/lib/api/compose.ts) (auth → role → org cache → module license → read-only guard → tenant DB); zod query helpers in `src/lib/api/query.ts`; central ZodError → 422.
*   **CRM**: lead management (list/inline-edit/drawer/convert), admission pipeline (list/grid/kanban, documents, convert-to-student, archive for admitted), student management (incl. section + year-end promotion wizard `/student-management/promote`), fee management (invoices, payments, PDF export, email), dashboard KPIs. Shared UI in `src/components/leads/` and `src/components/admissions/`.
*   **Academic-year switcher**: persisted global store [src/stores/academic-year.store.ts](file:///Users/vimaldas/Projects/VidhyaanCRM/src/stores/academic-year.store.ts) scopes dashboard, leads, admissions, students, fees; legacy null-AY rows show under every year.
*   **Events**: draft→publish→cancel lifecycle, cover images, list + month calendar, publish-time Announce (portal/email/metered SMS, audience counts, per-class filter, hand-picked recipients), parent portal Events tab with RSVP.
*   **Email templates**: 8 org-customizable emails in `/settings/email-templates` (registry + resolver in [src/lib/mail/org-templates.ts](file:///Users/vimaldas/Projects/VidhyaanCRM/src/lib/mail/org-templates.ts)); platform emails (OTP/registration/billing) locked.
*   **Onboarding/setup**: default admission stages seeded on org creation (`src/lib/utils/createDefaultAdmissionStages.ts`); one-time setup checklist at `/setup` with dashboard banner.
*   **Storage**: real S3 uploads via [src/lib/storage.ts](file:///Users/vimaldas/Projects/VidhyaanCRM/src/lib/storage.ts) — bucket `vidhyaan` (ap-south-1), per-module folders `uploads/{orgId}/{category}/`, public-read on `uploads/*` only.
*   **Codes**: lead/invoice/student codes generated from numeric max (never `count()+1`) — `src/lib/lead-code.ts`, `src/lib/invoice-number.ts`.
*   **Billing**: Razorpay orders/webhooks (signature-verified, fail-closed), subscriptions, plan modules; pure fee math in `src/lib/fees.ts`. **Payment secrets encrypted with `PAYMENT_ENCRYPTION_KEY` — must be identical in `.env.local` and Vercel (shared DB).**
*   **Subscription pricing system** (2026-07): 4 plans (slugs `free/starter/growth/enterprise` — display names differ) × 5 student slabs in `billing.plan_prices` (launch offers w/ auto-expiry, bundled AI credits). Full-page checkout `/settings/billing/upgrade` with Razorpay **GST invoices** (Bill-To on invoice `comment`, seller on `terms`; incl./excl. GST via platform settings), proration, coupons, per-org discount (cap 50%). Daily cron `/api/cron/billing`: reconcile sweep, renewal payment links (T−7), grace→expiry lockout, slab/custom-quote alerts. Pure money math in `src/lib/billing/money.ts` (tested); pricing engine `src/lib/pricing/effective.ts` — **prices always computed server-side**. Strategy: [docs/pricing-strategy-2026.md](file:///Users/vimaldas/Projects/VidhyaanCRM/docs/pricing-strategy-2026.md). Invariants: `payment.failed` webhook must never overwrite `gatewayRef` (order id needed for retry reconcile); no-refund policy disclosed at checkout/cancel/invoice.
*   **Messaging credits**: SMS/WhatsApp wallets + ledger in `src/lib/credits/` — **`metered-send.ts` is THE entry point for org-attributed sends** (BYO MSG91 creds first, else 1 credit/msg); credit-pack purchase via Razorpay; Settings → Add-ons UI. WhatsApp campaign templates: platform shared catalog + org copies (`/settings/whatsapp-templates`, `/admin/whatsapp-templates`), positional `{{1}}..{{n}}` params.
*   **Campaign platform** (`/campaign-management`): multi-step campaign builder (`new/` StepOne–Three) with **drag-drop block email builder** (`BlockBuilder.tsx`); **campaign email is SES-ONLY from `send.vidhyaan.com`** (ZeptoMail stays transactional-only). Daily send caps in `src/lib/campaign/limits.ts` (enterprise-quota aware); per-campaign **delivery tracking** (open/click, SMS DLR) via `providerMessageId` join + SES/MSG91 webhooks with an auto-pause guard; **A/B testing** (email); BYO Enterprise sending domain. Separate from the WhatsApp-template campaign path under Messaging.
*   **Auth extras**: unified login with workspace picker for multi-role users; settings nav registered in `src/components/settings/settingsNav.ts` (single source for new settings pages).
*   **Platform admin** (`/admin`): org approval, plans, stats, impersonation (SUPER_ADMIN).
*   **Marketplace** (`/`, `/schools`, `/learning-centers`): public search + profiles, enquiries (deduped per child+class), reviews, bookmarks, GPS distance filtering.
*   **Parent portal** (`/parent`): registration, dashboard, applications tracking, kids CRUD, notifications, events + RSVP, fees.
*   **UX primitives**: app-level ConfirmDialog ([src/components/ui/confirm-dialog.tsx](file:///Users/vimaldas/Projects/VidhyaanCRM/src/components/ui/confirm-dialog.tsx), provider mounted in CRM layout — never use `window.confirm`), branded DateTimePicker (`src/components/ui/datetime-picker.tsx` — never `datetime-local`).
*   **Reports & Analytics** (`/reports`, module `advanced_reports`): 3 role-based dashboards (executive w/ YoY + attention strip + institution-aware course/batch widgets for LC-type orgs, counsellor my-desk work queue, finance ageing) + 15 registry-driven reports (incl. course/batch performance + trial-class conversion for learning centres, daily activity log, payment register) (`src/lib/reports/registry.ts` — roles/filters/exports single source; query modules in `src/lib/reports/queries/`); nightly rollups to `reporting.daily_rollups` via `/api/cron/reports-rollup` (IST days, idempotent; backfill script `scripts/backfill-report-rollups.ts`); generic API `/api/v1/reports/r/[key]/{summary,rows,export}`; CSV/XLSX/PDF exports audit-logged; saved views + favourites + recents; scheduled email delivery (`/api/cron/report-schedules`, 08:00 IST, creator-scoped, fail-closed) with Schedule popover per report; executive widget show/hide+reorder (localStorage).
*   **2FA**: TOTP (otplib v13) + SMS fallback, challenge-token gate at login, org-level policy with `mustEnrol2fa` enforcement; enrol UI in Settings → Account.
*   **Dedup + Households**: cross-module duplicate detection (leads/admissions/students/enquiries) keyed on `phoneNormalized`; `Household` model groups guardians/kids across records.
*   **Digital forms**: entity-agnostic form engine — target adapters + canonical `mapsTo` field mapping; builder at `/settings/admission-forms`; public apply flow.
*   **Reviews**: parent reviews platform — type-adaptive rating categories (school vs learning centre), eligibility gate, flag/moderation flow; **always call `recomputeSchoolRating` after review mutations**.
*   **WhatsApp notification engine**: 23 workflow templates across lead/admission/fee lifecycles — entry point [src/lib/whatsapp/notify.ts](file:///Users/vimaldas/Projects/VidhyaanCRM/src/lib/whatsapp/notify.ts) (`sendTemplateNotification`; org adopting template from catalog IS the on/off switch; fire-and-forget, never fails caller); emitters in `src/lib/whatsapp/emitters.ts`. Platform sends go **direct via Meta Cloud API** (Graph API; MSG91 kept only for OTP path). Delivery webhook + opt-out compliance + inbound capture; inbox + sent log w/ read stats + staff prefs; WhatsApp OTP via org channel setting; fee payment links; event announce channel; category-based credit pricing; log retention.
*   **AI assistant**: header "Ask AI" pill launcher + sidebar (`src/components/ai/` — `AiSidebar`, `useAiChat`); external gateway `ai.vidhyaan.com` (`NEXT_PUBLIC_AI_GATEWAY_URL`); app mints gateway JWTs at `/api/v1/ai/token` (JWKS at `/api/public/ai/jwks`, signing in `src/lib/ai/`); streaming chat with citations, inline action-confirmation cards for create actions, feedback dialog, AI credit wallet + daily limit; admin metrics at `/admin` (`ai-metrics`, `ai-usage`). Architecture: [docs/vidhyaan-ai-solution-architecture.md](file:///Users/vimaldas/Projects/VidhyaanCRM/docs/vidhyaan-ai-solution-architecture.md).
*   **Attendance** (`/attendance`): single-table design with composite `sessionKey` (`AttendanceRecord`); teacher scoping via `TeacherAssignment.targetKey` + `assertCanMark`; UI branches on org type (`isLearningCentre`) — schools get Daily whole-class grid + Periods tabs, LC gets session cards; manual `RegisterGrid` marking, ad-hoc **"New Session"** (`SessionFormDialog`) with **double-booking guard** (409 CONFLICT + "Create anyway" `force:true` when a materialized session already covers the students); biometric ingest endpoint (separate `sessionKey:'DAY'` daily-gate record). `StudentAttendanceTab` on the student detail page.
*   **Scheduling & timetable** (`/schedule` for LC, `/timetable` for schools): LC per-student **custom schedules** (batch XOR individual `EnrollmentScheduleSlot`s, hours-cap materializer) built from student list/detail via `ScheduleBuilder` + `StudentScheduleModal` (edit **prefills** existing slots; schedule shown on `CourseEnrollmentCard`); school **weekly timetable** (`TimetableSlot` — grade/section/subject/teacher, overlap guards, swap + per-date cancel exceptions). Both materialize into `AttendanceSession` + `CourseSession` rows via `src/lib/schedule/materialize.ts` (cron `/api/cron/schedule-materialize`, idempotent). **Teacher→attendance bridge**: saving a `TimetableSlot` with a teacher upserts a grade/section `TeacherAssignment` (`src/lib/attendance/sync-teacher-assignment.ts`) so the timetabled teacher can actually mark that class; backfill `scripts/backfill-slot-teacher-assignments.ts`.
*   **Class/Section master**: masters drive class/section dropdowns app-wide, but record storage stays plain strings (slug vs label conventions); quick-enroll from master screen.
*   **Subjects master** (schools, `/settings/subjects`): `Subject` model drives the timetable subject dropdown; **records keep storing the subject NAME string** (`TimetableSlot.subject` etc.) — master only feeds the picker (`/api/v1/options/subjects` datalist). Same convention as Class/Section master. Backfill `scripts/backfill-subjects-master.ts` (distinct existing strings + seeded common set for schools with none).
*   **Platform ops** (`/admin`): usage metrics + rollup/prune cron, admin digest, announcements, uptime tile, integration config, platform flags.
*   **Brand/compliance**: Vidhyaan asset-kit logos app-wide; institution-type-aware labels (`institutionNoun` helper) in login + settings nav; public `/privacy-policy`, `/terms-of-service`, `/data-deletion` (Meta app compliance) pages.
*   **Tests**: vitest (`npm test`) — tenant isolation, fee math, rate limiter, query helpers; fail-closed test-DB guard (suites skip without `TEST_DATABASE_URL`, can never touch shared prod DB).

---

<!-- BUILD_STATUS_START -->
## 🤖 Autogenerated Project Status
*   **Last Run Timestamp**: `2026-07-21 22:14:04`
*   **Build Compilation**: `✓ Success` (Ready to deploy)
*   **Code Statistics**:
    *   [Dashboard (page.tsx)](file:///Users/vimaldas/Projects/VidhyaanCRM/src/app/(crm)/dashboard/page.tsx): `1202 lines` (`68.8 KB`)
    *   [Style Guide (globals.css)](file:///Users/vimaldas/Projects/VidhyaanCRM/src/app/globals.css): `9.8 KB`

<!-- BUILD_STATUS_END -->
