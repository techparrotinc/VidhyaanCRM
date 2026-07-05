-- Partial indexes for soft-delete models: every hot list query filters
-- WHERE org_id = ? AND deleted_at IS NULL. Partial indexes exclude dead rows,
-- keeping the index small and hot as soft-deleted data accumulates.
--
-- NOTE: partial indexes are not representable in schema.prisma — this is a
-- hand-written migration. `prisma migrate dev` drift checks may report these
-- as extra; that is expected and harmless.

CREATE INDEX IF NOT EXISTS "leads_org_active_created_idx"
  ON "crm"."leads" ("org_id", "created_at") WHERE "deleted_at" IS NULL;

CREATE INDEX IF NOT EXISTS "admissions_org_active_created_idx"
  ON "crm"."admissions" ("org_id", "created_at") WHERE "deleted_at" IS NULL;

CREATE INDEX IF NOT EXISTS "students_org_active_created_idx"
  ON "crm"."students" ("org_id", "created_at") WHERE "deleted_at" IS NULL;

CREATE INDEX IF NOT EXISTS "invoices_org_active_due_idx"
  ON "crm"."invoices" ("org_id", "due_date") WHERE "deleted_at" IS NULL;

CREATE INDEX IF NOT EXISTS "campaigns_org_active_created_idx"
  ON "crm"."campaigns" ("org_id", "created_at") WHERE "deleted_at" IS NULL;

CREATE INDEX IF NOT EXISTS "events_org_active_starts_idx"
  ON "crm"."events" ("org_id", "starts_at") WHERE "deleted_at" IS NULL;
