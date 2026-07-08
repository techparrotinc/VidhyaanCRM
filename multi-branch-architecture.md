# Multi-Branch Architecture — Design Doc

Status: **Phase 1 implemented** (2026-07-08)
Owner: Vimal Das

Enables school groups / learning-centre chains to run multiple branches (campuses)
under one Organization, with branch-scoped roles, a branch switcher for group
admins, and (in later phases) consolidated group-level reporting.

---

## 1. Role model

| Product term | Role enum | Data access |
|---|---|---|
| Group Admin | `ORG_ADMIN` | All branches — consolidated view + can switch to any single branch |
| Branch Admin | `BRANCH_ADMIN` | Only branches granted via `UserBranchAccess` |
| Counsellor | `COUNSELLOR` | Phase 1: org-wide (unchanged). Phase 2: branch + optional assigned-leads-only (`Organization.settings.counsellorLeadScope`) |

Core decision: **one `Organization` = the group; `Branch` = campus.** No
org-per-branch — billing, modules, credit wallets, tenant isolation are all
org-scoped and must stay unified.

## 2. Existing schema (already in place, reused as-is)

- `Branch` (platform schema): name, `code`, `isDefault`, address, soft delete.
- `UserBranchAccess`: user ↔ branch many-to-many with per-branch role.
- Nullable `branchId` on: Lead, LeadActivity, Admission, AdmissionActivity,
  AdmissionCapacity, Student, StudentBatch, FeePlan, Invoice, Payment, Event,
  Campaign, CounsellorTarget, DailyRollup.
- Registration creates a default branch + `UserBranchAccess` for the admin.

No schema migration was needed for Phase 1.

## 3. Request flow (Phase 1)

```
Browser                         Server
───────                         ──────
branch.store.ts (zustand,       compose.ts route() pipeline:
persisted selectedBranchId)       1. read x-branch-id header
        │                         2. resolve branch context (Redis-cached):
fetcher.ts attaches                  - org branch ids   org:{id}:branch-ids
`x-branch-id` header on              - user grants      user:{id}:branch-ids
every SWR GET                        (BRANCH_ADMIN only)
        │                         3. clamp: requested ∩ allowed, validate
        ▼                            against org's real branches
all list/detail reads           4. forOrg(orgId, { branchIds }) injects
scoped automatically               branch filter into every query
```

### 3.1 Branch context resolution (`compose.ts`)

- `ORG_ADMIN` / RECEPTIONIST / ACCOUNTANT / COUNSELLOR / platform roles:
  unrestricted (`allowed = null`). Header `x-branch-id`, if it names a valid
  org branch, narrows the view to that branch ("switching"). No header or the
  literal `all` = all branches.
- `BRANCH_ADMIN`: allowed = their `UserBranchAccess` branch ids. A requested
  branch outside the grant is ignored (clamped back to the grant). **Fail
  closed**: zero grants ⇒ they see only legacy `branchId = null` rows, never
  the whole org.
- Invalid/stale requested branch id (deleted branch, another org) is ignored —
  degrades to the caller's full allowed scope rather than erroring, so a stale
  localStorage value can't lock a user out.
- Context exposed to handlers as `ctx.branch: { activeBranchId, allowedBranchIds }`.

### 3.2 Enforcement choke point (`src/lib/db/tenant.ts`)

`forOrg(orgId, branch?)` — same fail-closed `$extends` pattern as org
isolation. For models in `BRANCH_MODELS`, when `branchIds` is non-null:

- **Reads/updates/deletes**: appends `AND: [{ OR: [{ branchId: { in: branchIds } }, { branchId: null }] }]`.
  The **null-inclusive** filter is deliberate:
  - legacy rows (created before multi-branch) stay visible everywhere ⇒ zero
    regression for existing orgs;
  - org-wide config rows (e.g. a FeePlan with `branchId = null`) apply to all
    branches by convention.
- **Creates**: `branchId ??= activeBranchId` when exactly one active branch is
  selected. Caller-provided branchId always wins. No active branch ⇒ row is
  created unstamped (legacy behaviour), and remains visible under every branch
  because of the null-inclusive read filter — graceful degradation, no data
  loss, backfill can stamp later.

Single-branch orgs / requests with no branch context: `forOrg(orgId)` behaves
exactly as before — the branch layer is entirely opt-in per request.

### 3.3 Why header + per-request resolution, not JWT claims

- No NextAuth/session shape change ⇒ no re-login required, no token bloat.
- Grants are re-checked per request (Redis 300s TTL) ⇒ a branch transfer takes
  effect within 5 minutes without touching session revocation, and the caches
  are busted eagerly on branch CRUD / grant changes.
- Client store is a *preference*, never an *authority* — the server clamps.

## 4. Branch switcher (UI)

- `src/stores/branch.store.ts` — persisted zustand store, mirrors the academic
  year switcher. **Defaults to the org's main (default) branch** on first load;
  `selectedBranchId = 'all'` is the explicit "All Branches" choice (compose.ts
  treats the literal `all` header as unscoped).
- `src/hooks/useBranches.ts` — SWR on `GET /api/v1/branches`.
- Switcher renders in the CRM header (left of the AY switcher) **only when the
  org has ≥ 2 active branches**. Single-branch orgs see no UI change at all.
- ORG_ADMIN sees "All Branches" + each branch; branch-restricted users see
  only their granted branches (API already filters the list).
- Selecting a branch triggers a full SWR revalidation (`mutate(() => true)`)
  so every visible list refetches under the new scope.

## 5. Branch management

- `GET/POST /api/v1/branches`, `PATCH/DELETE /api/v1/branches/[id]` —
  ORG_ADMIN (+ platform admins). Delete is soft (`deletedAt`), blocked for the
  default branch and for the last remaining branch. `isDefault` transfer
  supported via PATCH.
- `/settings/branches` page (registered in `settingsNav.ts`): list, create,
  edit, set-default, deactivate.
- Every branch mutation busts `org:{id}:branch-ids`.

## 6. Backfill — `scripts/backfill-branch-ids.ts`

Set-based, idempotent, per-org:

1. Orgs with no branch get a default branch created (`isDefault: true`).
2. All `branchId IS NULL` rows in branch-aware transactional tables are
   stamped with the org's default branch (raw SQL `UPDATE … FROM`, one
   statement per table — same style as the rollup backfill).
3. `BRANCH_ADMIN`s with zero `UserBranchAccess` rows are granted the default
   branch (keeps fail-closed enforcement from stranding them).

Run: `npx tsx scripts/backfill-branch-ids.ts` (needs `DATABASE_URL`).
`--dry-run` prints counts without writing.

**Note:** the system is safe *before* the backfill runs (null rows visible
everywhere); the backfill is what makes per-branch numbers *meaningful*.

## 7. Tests

`tests/branch-isolation.test.ts` (vitest, needs `DATABASE_URL`, mirrors
`tenant-isolation.test.ts`): two branches in one org — asserts branch-scoped
reads exclude the sibling branch, include null-branch legacy rows, stamp
creates, clamp updates; and that `forOrg` without branch context behaves
identically to before.

## 8. Later phases (agreed roadmap)

- **Phase 2 — people**: users page branch column + transfer dialog (update
  `UserBranchAccess`, audit log, bust caches, prompt for open-lead
  reassignment); invite flow branch picker; counsellor scoping setting.
- **Phase 3 — bird's-eye reporting**: `branch_id` dimension on
  `reporting.daily_rollups` + backfill; Group Overview executive dashboard
  (branch comparison table: revenue, collection rate, pipeline, conversion,
  ageing; leaderboard; attention strip); `branch` filter in the report
  registry for all 14 reports.
- **Phase 4 — polish**: marketplace `School` ↔ `Branch` mapping for enquiry
  routing; student/lead transfer between branches; per-branch attribution in
  messaging credit ledger; parent portal branch display; `multi_branch`
  module gating + per-plan branch caps; DB-level `NOT NULL` on `branchId`
  once all writes stamp it.

## 9. Invariants (do not break)

1. Branch filtering lives in `forOrg` / `compose.ts` only — never per-route
   ad-hoc `branchId` where clauses for access control.
2. The client-selected branch is a preference; the server clamp in
   `compose.ts` is the authority.
3. Branch read filters are null-inclusive until Phase 4 declares `branchId`
   NOT NULL.
4. Never delete the default branch; `isDefault` moves, it doesn't disappear.
5. New branch-aware models must be added to `BRANCH_MODELS` in `tenant.ts`.
