# Backup & Disaster-Recovery Plan — Vidhyaan CRM

Written after the 2026-07-08 user-table wipe (post-mortem below). Target
posture: **go-live with 10+ schools, any single mistake recoverable within
minutes, no school can lose more than 24h of data (goal: < 1h).**

---

## 1. Post-mortem: the 2026-07-08 wipe

**What was lost:** every row in `platform.users`, `user_role_assignments`,
`user_branch_access`. All other data (orgs, leads, students, invoices,
payments) untouched.

**How it happened — chain of five failures:**

1. `tests/reports-queries.test.ts` cleanup ran
   `prisma.user.deleteMany({ where: { id: counsellorId } })`.
2. A failed test setup left `counsellorId` **undefined**. Prisma silently
   drops undefined filters, so the call became `deleteMany({})` — delete
   every row. (Prisma footgun #1: undefined ≠ error, undefined = no filter.)
3. vitest was pointed at the **production** database — local dev, tests and
   prod all share one `DATABASE_URL`.
4. Neon point-in-time restore retention was only **6 hours**; the wipe was
   noticed later, outside the window.
5. No independent backups existed. Recovery only succeeded because a stale
   archived branch from June 28 happened to exist, plus audit-log forensics.

Every layer that could have stopped or fixed this was missing. The fix is
layered defence, not one silver bullet.

---

## 2. Prevention (stop deletion happening)

### 2.1 Environment separation — the root fix
One Neon project, three branches:

| Branch | Used by | Notes |
|---|---|---|
| `production` | Vercel only | **Protected branch** (Neon setting: blocks deletion/reset) |
| `dev` | local `npm run dev` | reset from prod weekly; `.env.local` points here |
| `test` | vitest (`TEST_DATABASE_URL`) | disposable; recreated from `dev` any time |

Local dev must **never** hold the production connection string. Vercel env
vars keep prod credentials; developers can't fat-finger prod from a laptop.

### 2.2 Application-level delete guard (code, cheap, immediate)
Extend the base Prisma client: **reject `deleteMany`/`updateMany` with an
empty or undefined-only `where` clause** on all models. A mass delete must
name an explicit filter; "delete everything" becomes impossible to express
by accident. (Tenant client `forOrg` already scopes deletes; this guards the
raw client that tests/scripts use.)

### 2.3 Test hygiene
- Cleanup blocks guard every id assigned in `beforeAll` (`if (!id) return`) —
  already applied to `reports-queries` and `branch-isolation`.
- Test data uses `isDummy: true` orgs and run-stamped codes — already the
  pattern; keep it.
- CI runs vitest against the `test` branch only.

### 2.4 Least-privilege options (later hardening)
- Separate Postgres role for the app without `TRUNCATE`/DDL.
- Neon "protected branch" on `production` (available now, one click).

---

## 3. Backup (make deletion recoverable)

Three layers, different failure modes:

### Layer 1 — Neon PITR (instant, whole-DB)
- Raise history retention from 6h to **7 days** (Neon paid setting; storage
  cost is incremental WAL only).
- Recovers: anything noticed within a week, to any second. Restore = create
  branch at timestamp, verify, promote or copy rows back.
- Limitation: whole-DB only — restoring one school by PITR alone rolls back
  every school.

### Layer 2 — Nightly full logical dump (off-provider copy)
- `pg_dump` (custom format) via GitHub Actions cron (03:00 IST) →
  encrypted → S3 bucket `vidhyaan-backups/full/YYYY-MM-DD.dump`.
- Retention: 30 daily + 12 monthly. S3 versioning + lifecycle rules.
- Recovers: Neon-account-level disasters (account lockout, provider outage,
  billing accident, project deletion) — the layer PITR can't cover.

### Layer 3 — Per-school (per-org) export — the "backup plan for each school"
Nightly job (`/api/cron/org-backups` or the same GitHub Action) that, for
every **non-dummy org**, exports that org's rows from all tenant tables
(leads, admissions, students, invoices, payments, fee plans, events, users
of that org, branches, settings) as one compressed JSON bundle:

```
s3://vidhyaan-backups/orgs/{orgId}/{YYYY-MM-DD}.json.gz
```

- Retention: 30 days rolling + 1st-of-month kept 12 months.
- Restore tool: `scripts/restore-org.ts <orgId> <date>` — upserts one
  school's bundle back **without touching any other school**. This is the
  single-school restore path PITR cannot give.
- Size: a school's CRM rows are small (MBs); 10 schools ≈ trivial cost.
- Bonus: doubles as a customer-facing "export my data" feature (schools can
  request their bundle — good for sales trust and compliance).

### What already helps (keep)
- **Soft deletes** on Lead/Admission/Student/Invoice/etc. — user-initiated
  deletes are recoverable by design; only raw hard deletes bypass this.
- **Append-only audit log** — forensics + partial reconstruction (it's how
  the AGM admin was rebuilt).

---

## 4. Restore runbook (per scenario)

| Scenario | Action | RPO / RTO |
|---|---|---|
| One school corrupted / bulk-deleted by mistake | `restore-org.ts` from last nightly bundle | ≤ 24h / ~10 min |
| Whole-DB bad migration or mass delete, noticed < 7 days | Neon PITR branch at T-minus, copy tables or promote | seconds / ~15 min |
| Neon account/project lost | Restore latest `pg_dump` to fresh Postgres, repoint `DATABASE_URL` | ≤ 24h / ~1–2h |
| Single user/table wiped | PITR branch → copy only affected tables (this incident's method) | seconds / ~30 min |

**Drill:** once a quarter, restore one dummy org from a bundle and one PITR
branch, timed. An untested backup is a hope, not a plan.

---

## 5. Rollout order (effort vs. protection)

1. **Today, zero cost:** enable Neon protected branch on `production`; raise
   PITR retention to 7 days; add the Prisma delete guard; create `dev` +
   `test` branches and repoint `.env.local` / `TEST_DATABASE_URL`.
2. **This week:** GitHub Action nightly `pg_dump` → S3; per-org export job +
   `restore-org.ts`.
3. **Before 10-school go-live:** first restore drill; document runbook link
   in CLAUDE.md; alerting (backup-failure → email).
