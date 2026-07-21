-- Per-campaign delivery tracking: bounce + complaint statuses.
ALTER TYPE "crm"."CampaignSendStatus" ADD VALUE IF NOT EXISTS 'BOUNCED';
ALTER TYPE "crm"."CampaignSendStatus" ADD VALUE IF NOT EXISTS 'COMPLAINED';

-- BYO per-org custom sending domain (Enterprise).
DO $$ BEGIN
  CREATE TYPE "crm"."SendingDomainStatus" AS ENUM ('PENDING', 'VERIFIED', 'FAILED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "crm"."org_sending_domains" (
  "id" TEXT NOT NULL,
  "org_id" TEXT NOT NULL,
  "domain" TEXT NOT NULL,
  "from_local_part" TEXT NOT NULL DEFAULT 'no-reply',
  "from_name" TEXT,
  "status" "crm"."SendingDomainStatus" NOT NULL DEFAULT 'PENDING',
  "dkim_tokens" TEXT[],
  "verified_at" TIMESTAMP(3),
  "last_checked_at" TIMESTAMP(3),
  "created_by_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "org_sending_domains_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "org_sending_domains_org_id_key" ON "crm"."org_sending_domains"("org_id");
CREATE INDEX IF NOT EXISTS "org_sending_domains_domain_idx" ON "crm"."org_sending_domains"("domain");
