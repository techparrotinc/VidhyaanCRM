-- CreateEnum
CREATE TYPE "billing"."MessageChannel" AS ENUM ('SMS', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "billing"."CreditLedgerReason" AS ENUM ('FREE_GRANT', 'SEND', 'SEND_REFUND', 'PURCHASE', 'ADMIN_ADJUST');

-- CreateEnum
CREATE TYPE "billing"."MessagingProviderStatus" AS ENUM ('DRAFT', 'VERIFIED', 'DISABLED');

-- AlterEnum
ALTER TYPE "billing"."TransactionType" ADD VALUE 'CREDIT_PURCHASE';

-- AlterTable
ALTER TABLE "billing"."transactions" ADD COLUMN     "metadata" JSONB;

-- CreateTable
CREATE TABLE "billing"."message_wallets" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "channel" "billing"."MessageChannel" NOT NULL,
    "free_allowance" INTEGER NOT NULL DEFAULT 25,
    "free_used" INTEGER NOT NULL DEFAULT 0,
    "purchased_balance" INTEGER NOT NULL DEFAULT 0,
    "period_start" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "message_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing"."message_credit_ledger" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "channel" "billing"."MessageChannel" NOT NULL,
    "delta" INTEGER NOT NULL,
    "reason" "billing"."CreditLedgerReason" NOT NULL,
    "ref" TEXT,
    "free_balance_after" INTEGER NOT NULL,
    "purchased_balance_after" INTEGER NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_credit_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing"."messaging_provider_configs" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "channel" "billing"."MessageChannel" NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'MSG91',
    "auth_key_encrypted" TEXT NOT NULL,
    "encryption_key_version" INTEGER NOT NULL DEFAULT 1,
    "auth_key_last4" TEXT,
    "sender_id" TEXT,
    "sms_flow_id" TEXT,
    "whatsapp_number" TEXT,
    "status" "billing"."MessagingProviderStatus" NOT NULL DEFAULT 'DRAFT',
    "verified_at" TIMESTAMP(3),
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "messaging_provider_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "message_wallets_org_id_channel_key" ON "billing"."message_wallets"("org_id", "channel");

-- CreateIndex
CREATE INDEX "message_credit_ledger_org_id_channel_created_at_idx" ON "billing"."message_credit_ledger"("org_id", "channel", "created_at");

-- CreateIndex
CREATE INDEX "message_credit_ledger_ref_idx" ON "billing"."message_credit_ledger"("ref");

-- CreateIndex
CREATE UNIQUE INDEX "messaging_provider_configs_org_id_channel_key" ON "billing"."messaging_provider_configs"("org_id", "channel");

-- AddForeignKey
ALTER TABLE "billing"."message_wallets" ADD CONSTRAINT "message_wallets_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "platform"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing"."messaging_provider_configs" ADD CONSTRAINT "messaging_provider_configs_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "platform"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Data: register the sms_addon module (idempotent)
INSERT INTO "platform"."modules" ("id", "slug", "name", "description", "created_at", "updated_at")
VALUES ('cmqxu0bcnr6us00009yha8sms', 'sms_addon', 'SMS', 'SMS campaign and notification sending via MSG91', NOW(), NOW())
ON CONFLICT ("slug") DO NOTHING;

-- Data: SMS is already live for everyone — enable sms_addon for all existing orgs
INSERT INTO "platform"."organization_modules" ("id", "org_id", "module_id", "enabled", "enabled_at", "created_at", "updated_at")
SELECT 'om_sms_' || o."id", o."id", m."id", true, NOW(), NOW(), NOW()
FROM "platform"."organizations" o
CROSS JOIN "platform"."modules" m
WHERE m."slug" = 'sms_addon'
ON CONFLICT ("org_id", "module_id") DO NOTHING;
