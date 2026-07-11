-- Category buckets on WhatsApp templates (org + shared catalog). Additive
-- with default — safe on live data.
ALTER TABLE "crm"."whatsapp_templates"
  ADD COLUMN "category" TEXT NOT NULL DEFAULT 'GENERAL';
ALTER TABLE "platform"."shared_whatsapp_templates"
  ADD COLUMN "category" TEXT NOT NULL DEFAULT 'GENERAL';
