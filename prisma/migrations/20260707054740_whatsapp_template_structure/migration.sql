-- CreateEnum
CREATE TYPE "crm"."WaAccountScope" AS ENUM ('VIDHYAAN', 'OWN');

-- CreateEnum
CREATE TYPE "crm"."WaTemplateStatus" AS ENUM ('DRAFT', 'VERIFIED', 'SYNCED');

-- AlterTable
ALTER TABLE "crm"."campaigns" ADD COLUMN     "whatsapp_template_id" TEXT;

-- AlterTable
ALTER TABLE "crm"."whatsapp_templates" ADD COLUMN     "account_scope" "crm"."WaAccountScope" NOT NULL DEFAULT 'VIDHYAAN',
ADD COLUMN     "language" TEXT NOT NULL DEFAULT 'en',
ADD COLUMN     "provider_config_id" TEXT,
ADD COLUMN     "shared_template_id" TEXT,
ADD COLUMN     "status" "crm"."WaTemplateStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "variables" JSONB;

-- CreateTable
CREATE TABLE "platform"."shared_whatsapp_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "msg91_template_id" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "body" TEXT NOT NULL,
    "variables" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "shared_whatsapp_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "shared_whatsapp_templates_is_active_idx" ON "platform"."shared_whatsapp_templates"("is_active");

-- CreateIndex
CREATE INDEX "whatsapp_templates_shared_template_id_idx" ON "crm"."whatsapp_templates"("shared_template_id");

-- Data: existing hand-typed templates were used on the Vidhyaan account and
-- predate the variables model — mark them VERIFIED legacy (single-blob mode)
UPDATE "crm"."whatsapp_templates"
SET "status" = 'VERIFIED'
WHERE "deleted_at" IS NULL;
