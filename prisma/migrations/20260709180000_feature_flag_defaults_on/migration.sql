-- Campaign / AI / Public-API flags become platform-wide kill-switches that are
-- now actually enforced. Default them ON and set the existing settings row ON
-- so current behaviour (features available) is preserved.
ALTER TABLE "platform"."platform_settings" ALTER COLUMN "enable_campaign_module" SET DEFAULT true;
ALTER TABLE "platform"."platform_settings" ALTER COLUMN "enable_ai_features" SET DEFAULT true;
ALTER TABLE "platform"."platform_settings" ALTER COLUMN "enable_public_api_access" SET DEFAULT true;

UPDATE "platform"."platform_settings"
SET "enable_campaign_module" = true,
    "enable_ai_features" = true,
    "enable_public_api_access" = true
WHERE "id" = 'default';
