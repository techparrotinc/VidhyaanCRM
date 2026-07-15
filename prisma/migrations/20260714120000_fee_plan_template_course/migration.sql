-- AlterTable
ALTER TABLE "crm"."fee_plan_templates" ADD COLUMN "course_id" TEXT;

-- CreateIndex
CREATE INDEX "fee_plan_templates_course_id_idx" ON "crm"."fee_plan_templates"("course_id");

-- AddForeignKey
ALTER TABLE "crm"."fee_plan_templates" ADD CONSTRAINT "fee_plan_templates_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "crm"."courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
