-- Rich block-builder body for EMAIL campaigns (ordered EmailBlock[]).
ALTER TABLE "crm"."campaigns" ADD COLUMN IF NOT EXISTS "email_blocks" JSONB;
