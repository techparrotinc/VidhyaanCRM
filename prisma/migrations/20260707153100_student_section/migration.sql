ALTER TABLE "crm"."students" ADD COLUMN "section" TEXT;
CREATE INDEX "students_org_id_grade_label_section_idx" ON "crm"."students"("org_id", "grade_label", "section");
