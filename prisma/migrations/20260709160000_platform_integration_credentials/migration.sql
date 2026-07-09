-- AlterTable: admin-managed integration credentials (all nullable → env fallback)
ALTER TABLE "platform"."platform_settings"
  ADD COLUMN "razorpay_key_id" TEXT,
  ADD COLUMN "razorpay_key_secret_enc" TEXT,
  ADD COLUMN "razorpay_webhook_secret_enc" TEXT,
  ADD COLUMN "s3_region" TEXT,
  ADD COLUMN "s3_access_key_id" TEXT,
  ADD COLUMN "s3_secret_key_enc" TEXT,
  ADD COLUMN "zepto_token_enc" TEXT,
  ADD COLUMN "zepto_from_email" TEXT,
  ADD COLUMN "zepto_campaign_email" TEXT,
  ADD COLUMN "msg91_auth_key_enc" TEXT,
  ADD COLUMN "msg91_whatsapp_number" TEXT,
  ADD COLUMN "msg91_sender_id" TEXT;
