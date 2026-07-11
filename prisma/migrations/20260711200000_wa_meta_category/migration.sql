-- Meta pricing category on templates (marketing sends cost 2 credits).
ALTER TABLE "crm"."whatsapp_templates" ADD COLUMN "meta_category" TEXT;
ALTER TABLE "platform"."shared_whatsapp_templates" ADD COLUMN "meta_category" TEXT;
