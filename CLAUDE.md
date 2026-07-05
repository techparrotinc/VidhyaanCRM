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
*   **CRM**: lead management (list/inline-edit/drawer/convert), admission pipeline (list/grid/kanban, documents, convert-to-student), student management, fee management (invoices, payments, PDF export, email), dashboard KPIs. Shared UI in `src/components/leads/` and `src/components/admissions/`.
*   **Billing**: Razorpay orders/webhooks (signature-verified, fail-closed), subscriptions, plan modules; pure fee math in `src/lib/fees.ts`.
*   **Platform admin** (`/admin`): org approval, plans, stats, impersonation (SUPER_ADMIN).
*   **Marketplace** (`/`, `/schools`, `/learning-centers`): public search + profiles, enquiries, reviews, bookmarks, GPS distance filtering.
*   **Parent portal** (`/parent`): registration, dashboard, applications tracking, kids CRUD, notifications.
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
