-- Extend AuditAction with soft-op verbs distinct from hard DELETE.
-- Postgres requires each ADD VALUE in its own statement; IF NOT EXISTS keeps
-- this idempotent across environments that may already carry a value.
ALTER TYPE "platform"."AuditAction" ADD VALUE IF NOT EXISTS 'ARCHIVE';
ALTER TYPE "platform"."AuditAction" ADD VALUE IF NOT EXISTS 'RESTORE';
ALTER TYPE "platform"."AuditAction" ADD VALUE IF NOT EXISTS 'VOID';
