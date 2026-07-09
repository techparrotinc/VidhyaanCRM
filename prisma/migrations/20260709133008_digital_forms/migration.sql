-- CreateEnum
CREATE TYPE "crm"."FormPurpose" AS ENUM ('ADMISSION', 'LEAD', 'ENQUIRY', 'STANDALONE');

-- CreateEnum
CREATE TYPE "crm"."FormStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "crm"."FormInstanceStatus" AS ENUM ('SENT', 'OPENED', 'SUBMITTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "crm"."FormChannel" AS ENUM ('EMAIL', 'WHATSAPP', 'SMS', 'LINK');

-- CreateEnum
CREATE TYPE "crm"."FormPaymentStatus" AS ENUM ('NONE', 'PENDING', 'PAID', 'FAILED');

-- CreateEnum
CREATE TYPE "crm"."FormReviewStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateTable
CREATE TABLE "crm"."forms" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "branch_id" TEXT,
    "academic_year_id" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "purpose" "crm"."FormPurpose" NOT NULL DEFAULT 'ADMISSION',
    "status" "crm"."FormStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "slug" TEXT,
    "schema" JSONB NOT NULL,
    "settings" JSONB,
    "course_ids" TEXT[],
    "grade_labels" TEXT[],
    "application_fee_amount" DECIMAL(10,2),
    "fee_currency" TEXT NOT NULL DEFAULT 'INR',
    "fee_required" BOOLEAN NOT NULL DEFAULT false,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm"."form_instances" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "form_id" TEXT NOT NULL,
    "target_type" "crm"."FormPurpose" NOT NULL,
    "target_id" TEXT,
    "campaign_id" TEXT,
    "token" TEXT NOT NULL,
    "status" "crm"."FormInstanceStatus" NOT NULL DEFAULT 'SENT',
    "channel" "crm"."FormChannel" NOT NULL DEFAULT 'LINK',
    "sent_to_email" TEXT,
    "sent_to_phone" TEXT,
    "prefill" JSONB,
    "payment_status" "crm"."FormPaymentStatus" NOT NULL DEFAULT 'NONE',
    "gateway_ref" TEXT,
    "expires_at" TIMESTAMP(3),
    "opened_at" TIMESTAMP(3),
    "submitted_at" TIMESTAMP(3),
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "form_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm"."form_submissions" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "instance_id" TEXT NOT NULL,
    "form_id" TEXT NOT NULL,
    "target_type" "crm"."FormPurpose" NOT NULL,
    "target_id" TEXT,
    "campaign_id" TEXT,
    "schema_version" INTEGER NOT NULL,
    "data" JSONB NOT NULL,
    "files" JSONB,
    "field_states" JSONB,
    "review_status" "crm"."FormReviewStatus" NOT NULL DEFAULT 'PENDING',
    "payment_status" "crm"."FormPaymentStatus" NOT NULL DEFAULT 'NONE',
    "reviewed_by_id" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "submitter_ip" TEXT,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "form_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "forms_org_id_purpose_status_idx" ON "crm"."forms"("org_id", "purpose", "status");

-- CreateIndex
CREATE INDEX "forms_org_id_created_at_idx" ON "crm"."forms"("org_id", "created_at");

-- CreateIndex
CREATE INDEX "forms_branch_id_idx" ON "crm"."forms"("branch_id");

-- CreateIndex
CREATE INDEX "forms_academic_year_id_idx" ON "crm"."forms"("academic_year_id");

-- CreateIndex
CREATE UNIQUE INDEX "form_instances_token_key" ON "crm"."form_instances"("token");

-- CreateIndex
CREATE INDEX "form_instances_org_id_idx" ON "crm"."form_instances"("org_id");

-- CreateIndex
CREATE INDEX "form_instances_form_id_idx" ON "crm"."form_instances"("form_id");

-- CreateIndex
CREATE INDEX "form_instances_org_id_target_type_target_id_idx" ON "crm"."form_instances"("org_id", "target_type", "target_id");

-- CreateIndex
CREATE INDEX "form_instances_campaign_id_idx" ON "crm"."form_instances"("campaign_id");

-- CreateIndex
CREATE INDEX "form_submissions_org_id_idx" ON "crm"."form_submissions"("org_id");

-- CreateIndex
CREATE INDEX "form_submissions_instance_id_idx" ON "crm"."form_submissions"("instance_id");

-- CreateIndex
CREATE INDEX "form_submissions_form_id_idx" ON "crm"."form_submissions"("form_id");

-- CreateIndex
CREATE INDEX "form_submissions_org_id_review_status_idx" ON "crm"."form_submissions"("org_id", "review_status");

-- CreateIndex
CREATE INDEX "form_submissions_campaign_id_idx" ON "crm"."form_submissions"("campaign_id");

-- AddForeignKey
ALTER TABLE "crm"."forms" ADD CONSTRAINT "forms_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "platform"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."forms" ADD CONSTRAINT "forms_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "platform"."branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."forms" ADD CONSTRAINT "forms_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "crm"."academic_years"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."form_instances" ADD CONSTRAINT "form_instances_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "crm"."forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."form_submissions" ADD CONSTRAINT "form_submissions_instance_id_fkey" FOREIGN KEY ("instance_id") REFERENCES "crm"."form_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."form_submissions" ADD CONSTRAINT "form_submissions_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "crm"."forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

