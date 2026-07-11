-- Meta WhatsApp Cloud API credentials on platform settings (direct Graph API,
-- no BSP). Additive nullable columns — safe on live data.
ALTER TABLE "platform"."platform_settings"
  ADD COLUMN "meta_wa_access_token_enc" TEXT,
  ADD COLUMN "meta_wa_phone_number_id" TEXT,
  ADD COLUMN "meta_wa_business_account_id" TEXT;
