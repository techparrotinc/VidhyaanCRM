-- CreateEnum
CREATE TYPE "crm"."InvoiceType" AS ENUM ('TERM', 'ADHOC', 'COURSE');

-- CreateEnum
CREATE TYPE "crm"."EnrollmentStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "crm"."CenterCategory" AS ENUM ('MUSIC', 'DANCE', 'ART', 'ABACUS', 'COACHING', 'SPORTS', 'LANGUAGE', 'STEM', 'OTHER');

-- AlterTable
ALTER TABLE "crm"."fee_plan_templates" ADD COLUMN     "grade_label" TEXT,
ADD COLUMN     "institution_type" TEXT;

-- AlterTable
ALTER TABLE "crm"."invoices" ADD COLUMN     "course_id" TEXT,
ADD COLUMN     "invoice_type" "crm"."InvoiceType" NOT NULL DEFAULT 'ADHOC',
ADD COLUMN     "term_id" TEXT;

-- AlterTable
ALTER TABLE "marketplace"."schools" ADD COLUMN     "center_category" TEXT;

-- AlterTable
ALTER TABLE "platform"."organizations" ADD COLUMN     "center_category" TEXT;

-- CreateTable
CREATE TABLE "crm"."terms" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "academic_year_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "terms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm"."courses" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "crm"."CenterCategory",
    "amount" DECIMAL(10,2) NOT NULL,
    "frequency" "crm"."FeeFrequency" NOT NULL DEFAULT 'MONTHLY',
    "billing_day" INTEGER NOT NULL DEFAULT 1,
    "duration_months" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm"."course_enrollments" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "status" "crm"."EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "next_billing_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "terms_org_id_idx" ON "crm"."terms"("org_id");

-- CreateIndex
CREATE INDEX "terms_academic_year_id_idx" ON "crm"."terms"("academic_year_id");

-- CreateIndex
CREATE INDEX "courses_org_id_idx" ON "crm"."courses"("org_id");

-- CreateIndex
CREATE INDEX "course_enrollments_org_id_idx" ON "crm"."course_enrollments"("org_id");

-- CreateIndex
CREATE INDEX "course_enrollments_student_id_idx" ON "crm"."course_enrollments"("student_id");

-- CreateIndex
CREATE INDEX "course_enrollments_course_id_idx" ON "crm"."course_enrollments"("course_id");

-- CreateIndex
CREATE UNIQUE INDEX "course_enrollments_student_id_course_id_key" ON "crm"."course_enrollments"("student_id", "course_id");

-- CreateIndex
CREATE INDEX "invoices_term_id_idx" ON "crm"."invoices"("term_id");

-- CreateIndex
CREATE INDEX "invoices_course_id_idx" ON "crm"."invoices"("course_id");

-- AddForeignKey
ALTER TABLE "crm"."invoices" ADD CONSTRAINT "invoices_term_id_fkey" FOREIGN KEY ("term_id") REFERENCES "crm"."terms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."invoices" ADD CONSTRAINT "invoices_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "crm"."courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."terms" ADD CONSTRAINT "terms_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "platform"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."terms" ADD CONSTRAINT "terms_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "crm"."academic_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."courses" ADD CONSTRAINT "courses_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "platform"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."course_enrollments" ADD CONSTRAINT "course_enrollments_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "platform"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."course_enrollments" ADD CONSTRAINT "course_enrollments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "crm"."students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."course_enrollments" ADD CONSTRAINT "course_enrollments_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "crm"."courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
