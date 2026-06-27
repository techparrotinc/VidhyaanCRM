/*
  Warnings:

  - The values [INACTIVE,WITHDRAWN] on the enum `StudentStatus` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[user_id]` on the table `parents` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "crm"."StudentStatus_new" AS ENUM ('ACTIVE', 'ALUMNI', 'TRANSFERRED', 'SUSPENDED', 'DROPPED_OUT');
ALTER TABLE "crm"."students" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "crm"."students" ALTER COLUMN "status" TYPE "crm"."StudentStatus_new" USING ("status"::text::"crm"."StudentStatus_new");
ALTER TYPE "crm"."StudentStatus" RENAME TO "StudentStatus_old";
ALTER TYPE "crm"."StudentStatus_new" RENAME TO "StudentStatus";
DROP TYPE "crm"."StudentStatus_old";
ALTER TABLE "crm"."students" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
COMMIT;

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "platform"."AuditAction" ADD VALUE 'PIN_SET';
ALTER TYPE "platform"."AuditAction" ADD VALUE 'PIN_RESET';
ALTER TYPE "platform"."AuditAction" ADD VALUE 'IMPERSONATION_START';

-- AlterEnum
ALTER TYPE "platform"."OrgStatus" ADD VALUE 'TRIAL_EXPIRED';

-- AlterTable
ALTER TABLE "billing"."plans" ADD COLUMN     "annual_price" DECIMAL(12,2),
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "quarterly_price" DECIMAL(12,2);

-- AlterTable
ALTER TABLE "crm"."admissions" ADD COLUMN     "parent_name" TEXT;

-- AlterTable
ALTER TABLE "crm"."leads" ADD COLUMN     "batch" TEXT,
ADD COLUMN     "child_age" INTEGER,
ADD COLUMN     "course" TEXT,
ADD COLUMN     "current_school" TEXT,
ADD COLUMN     "expected_join_date" TIMESTAMP(3),
ADD COLUMN     "sibling_in_school" BOOLEAN DEFAULT false,
ADD COLUMN     "start_date" TIMESTAMP(3),
ADD COLUMN     "student_age" TEXT;

-- AlterTable
ALTER TABLE "crm"."notifications" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "marketplace"."parent_enquiries" ADD COLUMN     "last_follow_up_at" TIMESTAMP(3),
ADD COLUMN     "preferred_date" TIMESTAMP(3),
ADD COLUMN     "preferred_time" TEXT,
ADD COLUMN     "type" TEXT DEFAULT 'ENQUIRY',
ADD COLUMN     "visitor_count" INTEGER;

-- AlterTable
ALTER TABLE "marketplace"."parents" ADD COLUMN     "user_id" TEXT;

-- AlterTable
ALTER TABLE "marketplace"."schools" ADD COLUMN     "academic_year" TEXT,
ADD COLUMN     "admission_deadline" TIMESTAMP(3),
ADD COLUMN     "admission_form_link" TEXT,
ADD COLUMN     "rejection_reason" TEXT,
ADD COLUMN     "verified_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "platform"."organization_modules" ADD COLUMN     "disabled_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "platform"."organizations" ADD COLUMN     "trial_reminder_sent" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "platform"."users" ADD COLUMN     "pin_set_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "platform"."platform_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "free_plan_lead_cap" INTEGER NOT NULL DEFAULT 10,
    "trial_duration_days" INTEGER NOT NULL DEFAULT 7,
    "default_otp_ttl_minutes" INTEGER NOT NULL DEFAULT 10,
    "enable_whatsapp" BOOLEAN NOT NULL DEFAULT false,
    "enable_campaign_module" BOOLEAN NOT NULL DEFAULT false,
    "enable_ai_features" BOOLEAN NOT NULL DEFAULT false,
    "enable_public_api_access" BOOLEAN NOT NULL DEFAULT false,
    "maintenance_mode" BOOLEAN NOT NULL DEFAULT false,
    "from_email_address" TEXT,
    "support_email" TEXT,
    "from_name" TEXT,
    "ops_alert_email" TEXT,
    "slack_webhook_url" TEXT,
    "razorpay_live_key" TEXT,
    "razorpay_webhook_secret" TEXT,
    "do_spaces_endpoint" TEXT,
    "do_spaces_bucket" TEXT,
    "do_spaces_cdn_url" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "parents_user_id_key" ON "marketplace"."parents"("user_id");

-- AddForeignKey
ALTER TABLE "marketplace"."parents" ADD CONSTRAINT "parents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "platform"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
