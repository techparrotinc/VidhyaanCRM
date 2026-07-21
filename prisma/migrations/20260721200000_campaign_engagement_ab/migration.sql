-- Email engagement (SES Open/Click) + A/B variant assignment on recipients.
ALTER TABLE "crm"."campaign_recipients" ADD COLUMN IF NOT EXISTS "opened_at" TIMESTAMP(3);
ALTER TABLE "crm"."campaign_recipients" ADD COLUMN IF NOT EXISTS "clicked_at" TIMESTAMP(3);
ALTER TABLE "crm"."campaign_recipients" ADD COLUMN IF NOT EXISTS "variant_key" TEXT;

-- A/B test configuration on the campaign.
ALTER TABLE "crm"."campaigns" ADD COLUMN IF NOT EXISTS "ab_variants" JSONB;
ALTER TABLE "crm"."campaigns" ADD COLUMN IF NOT EXISTS "ab_test_percent" INTEGER;
ALTER TABLE "crm"."campaigns" ADD COLUMN IF NOT EXISTS "ab_winner_key" TEXT;
ALTER TABLE "crm"."campaigns" ADD COLUMN IF NOT EXISTS "ab_winner_sent_at" TIMESTAMP(3);
