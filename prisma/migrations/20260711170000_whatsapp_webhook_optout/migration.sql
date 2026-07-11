-- WhatsApp delivery webhook support: message log, opt-outs, inbound store,
-- campaign delivery columns, webhook credentials. All additive.

ALTER TYPE "crm"."CampaignSendStatus" ADD VALUE IF NOT EXISTS 'READ';

ALTER TABLE "crm"."campaign_recipients"
  ADD COLUMN "read_at" TIMESTAMP(3),
  ADD COLUMN "provider_message_id" TEXT;
CREATE INDEX "campaign_recipients_provider_message_id_idx"
  ON "crm"."campaign_recipients"("provider_message_id");

CREATE TABLE "crm"."whatsapp_messages" (
  "id" TEXT NOT NULL,
  "org_id" TEXT NOT NULL,
  "wamid" TEXT,
  "phone" TEXT NOT NULL,
  "template_name" TEXT NOT NULL,
  "ref" TEXT,
  "status" TEXT NOT NULL DEFAULT 'ACCEPTED',
  "error" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "whatsapp_messages_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "whatsapp_messages_wamid_key" ON "crm"."whatsapp_messages"("wamid");
CREATE INDEX "whatsapp_messages_org_id_created_at_idx" ON "crm"."whatsapp_messages"("org_id", "created_at");
CREATE INDEX "whatsapp_messages_phone_idx" ON "crm"."whatsapp_messages"("phone");

CREATE TABLE "platform"."whatsapp_opt_outs" (
  "id" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "reason" TEXT NOT NULL DEFAULT 'STOP',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "whatsapp_opt_outs_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "whatsapp_opt_outs_phone_key" ON "platform"."whatsapp_opt_outs"("phone");

CREATE TABLE "platform"."whatsapp_inbound_messages" (
  "id" TEXT NOT NULL,
  "wamid" TEXT,
  "phone" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "org_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "whatsapp_inbound_messages_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "whatsapp_inbound_messages_wamid_key" ON "platform"."whatsapp_inbound_messages"("wamid");
CREATE INDEX "whatsapp_inbound_messages_phone_idx" ON "platform"."whatsapp_inbound_messages"("phone");
CREATE INDEX "whatsapp_inbound_messages_org_id_created_at_idx" ON "platform"."whatsapp_inbound_messages"("org_id", "created_at");

ALTER TABLE "platform"."platform_settings"
  ADD COLUMN "meta_wa_app_secret_enc" TEXT,
  ADD COLUMN "meta_wa_webhook_verify_token" TEXT;
