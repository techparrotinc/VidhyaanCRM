import 'dotenv/config'
import { config as dotenvConfig } from 'dotenv'

// TEST_DATABASE_URL lives in .env.local (never committed); plain
// 'dotenv/config' only reads .env, silently skipping every DB-backed suite.
dotenvConfig({ path: '.env.local' })

// Fail-closed test DB guard (post user-wipe incident 2026-07-08).
//
// Integration suites (tenant-isolation, branch-isolation, reports-rollup, …)
// connect to DATABASE_URL and create/hard-delete rows. Local .env points that
// at the SHARED PROD Neon database, so running them there is a data-loss risk.
//
// Rule: DB tests only ever run against TEST_DATABASE_URL (a disposable Neon
// branch). When it isn't set, DATABASE_URL is stripped so any suite that
// reaches for the database fails to connect instead of touching prod.
// Pure unit suites (fee math, rate limiter, query helpers) are unaffected.
if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL
  process.env.DIRECT_URL = process.env.TEST_DIRECT_URL ?? process.env.TEST_DATABASE_URL
} else {
  // Overwrite (don't delete): Prisma Client re-loads .env at import time and
  // would silently refill a deleted DATABASE_URL with the prod URL. An
  // explicit value wins — dotenv never overrides existing vars.
  const poison = 'postgresql://blocked:blocked@test-database-url-not-set.invalid:5432/blocked'
  process.env.DATABASE_URL = poison
  process.env.DIRECT_URL = poison
  // eslint-disable-next-line no-console
  console.warn(
    '[tests/setup] TEST_DATABASE_URL not set — DB-backed suites will fail to connect ' +
      '(by design; they must never run against the shared prod database). ' +
      'Create a Neon branch and set TEST_DATABASE_URL to enable them.'
  )
}
