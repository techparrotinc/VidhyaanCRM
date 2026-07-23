-- Marketplace parent notification + privacy consent prefs (Parent portal → My Profile).
-- Previously localStorage-only; now persisted so choices survive across devices
-- and can be honoured by send paths. Additive, defaulted — backfills every existing
-- parent to the prior implicit "all on" behaviour.
ALTER TABLE "marketplace"."parents"
  ADD COLUMN IF NOT EXISTS "notify_email"             BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "notify_sms"               BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "notify_whatsapp"          BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "allow_school_contact"     BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "show_profile_to_schools"  BOOLEAN NOT NULL DEFAULT true;
