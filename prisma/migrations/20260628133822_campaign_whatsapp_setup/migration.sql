/*
  Warnings:

  - The values [SENT,PAUSED] on the enum `CampaignStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `contact` on the `campaign_recipients` table. All the data in the column will be lost.
  - You are about to drop the column `provider_ref` on the `campaign_recipients` table. All the data in the column will be lost.
  - The `status` column on the `campaign_recipients` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "crm"."CampaignSendStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'FAILED');

-- AlterEnum
BEGIN;
CREATE TYPE "crm"."CampaignStatus_new" AS ENUM ('DRAFT', 'SCHEDULED', 'SENDING', 'COMPLETED', 'FAILED');
ALTER TABLE "crm"."campaigns" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "crm"."campaigns" ALTER COLUMN "status" TYPE "crm"."CampaignStatus_new" USING ("status"::text::"crm"."CampaignStatus_new");
ALTER TYPE "crm"."CampaignStatus" RENAME TO "CampaignStatus_old";
ALTER TYPE "crm"."CampaignStatus_new" RENAME TO "CampaignStatus";
DROP TYPE "crm"."CampaignStatus_old";
ALTER TABLE "crm"."campaigns" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;

-- DropIndex
DROP INDEX "crm"."campaign_recipients_status_idx";

-- AlterTable
ALTER TABLE "crm"."campaign_recipients" DROP COLUMN "contact",
DROP COLUMN "provider_ref",
ADD COLUMN     "delivered_at" TIMESTAMP(3),
ADD COLUMN     "email" TEXT,
ADD COLUMN     "failure_reason" TEXT,
ADD COLUMN     "name" TEXT,
ADD COLUMN     "phone" TEXT,
DROP COLUMN "status",
ADD COLUMN     "status" "crm"."CampaignSendStatus" NOT NULL DEFAULT 'PENDING';

-- DropEnum
DROP TYPE "crm"."RecipientStatus";

-- CreateTable
CREATE TABLE "crm"."whatsapp_templates" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "msg91_template_id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "whatsapp_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "whatsapp_templates_org_id_idx" ON "crm"."whatsapp_templates"("org_id");

-- AddForeignKey
ALTER TABLE "crm"."whatsapp_templates" ADD CONSTRAINT "whatsapp_templates_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "platform"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
