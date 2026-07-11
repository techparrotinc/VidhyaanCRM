-- Custom template token values on campaigns (holiday reason, resume date…).
ALTER TABLE "crm"."campaigns" ADD COLUMN "param_values" JSONB;
