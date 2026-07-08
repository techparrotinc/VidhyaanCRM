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
- **Run Tests**: `npm test` (vitest — tenant isolation suite needs `DATABASE_URL`)
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

*   **Data layer**: 76 Prisma models across 4 PostgreSQL schemas (`platform`, `crm`, `billing`, `marketplace`); tenant isolation + soft delete via fail-closed `$extends` client in [src/lib/db/tenant.ts](file:///Users/vimaldas/Projects/VidhyaanCRM/src/lib/db/tenant.ts).
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
*   **Messaging credits**: SMS/WhatsApp wallets + ledger in `src/lib/credits/` — **`metered-send.ts` is THE entry point for org-attributed sends** (BYO MSG91 creds first, else 1 credit/msg); credit-pack purchase via Razorpay; Settings → Add-ons UI. WhatsApp campaign templates: platform shared catalog + org copies (`/settings/whatsapp-templates`, `/admin/whatsapp-templates`), positional `{{1}}..{{n}}` params.
*   **Auth extras**: unified login with workspace picker for multi-role users; settings nav registered in `src/components/settings/settingsNav.ts` (single source for new settings pages).
*   **Platform admin** (`/admin`): org approval, plans, stats, impersonation (SUPER_ADMIN).
*   **Marketplace** (`/`, `/schools`, `/learning-centers`): public search + profiles, enquiries (deduped per child+class), reviews, bookmarks, GPS distance filtering.
*   **Parent portal** (`/parent`): registration, dashboard, applications tracking, kids CRUD, notifications, events + RSVP, fees.
*   **UX primitives**: app-level ConfirmDialog ([src/components/ui/confirm-dialog.tsx](file:///Users/vimaldas/Projects/VidhyaanCRM/src/components/ui/confirm-dialog.tsx), provider mounted in CRM layout — never use `window.confirm`), branded DateTimePicker (`src/components/ui/datetime-picker.tsx` — never `datetime-local`).
*   **Reports & Analytics** (`/reports`, module `advanced_reports`): 3 role-based dashboards (executive w/ YoY + attention strip + institution-aware course/batch widgets for LC-type orgs, counsellor my-desk work queue, finance ageing) + 13 registry-driven reports (incl. course/batch performance for learning centres, daily activity log, payment register) (`src/lib/reports/registry.ts` — roles/filters/exports single source; query modules in `src/lib/reports/queries/`); nightly rollups to `reporting.daily_rollups` via `/api/cron/reports-rollup` (IST days, idempotent; backfill script `scripts/backfill-report-rollups.ts`); generic API `/api/v1/reports/r/[key]/{summary,rows,export}`; CSV/XLSX/PDF exports audit-logged; saved views + favourites + recents.
*   **Tests**: vitest (`npm test`) — tenant isolation, fee math, rate limiter, query helpers.

---

<!-- BUILD_STATUS_START -->
## 🤖 Autogenerated Project Status
*   **Last Run Timestamp**: `2026-06-25 22:42:16`
*   **Build Compilation**: `✓ Success` (Ready to deploy)
*   **Code Statistics**:
    *   [Dashboard (page.tsx)](file:///Users/vimaldas/Projects/VidhyaanCRM/src/app/(crm)/dashboard/page.tsx): `1440 lines` (`73.8 KB`)
    *   [Style Guide (globals.css)](file:///Users/vimaldas/Projects/VidhyaanCRM/src/app/globals.css): `10.4 KB`

<!-- BUILD_STATUS_END -->
