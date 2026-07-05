-- DropIndex
DROP INDEX "crm"."leads_org_id_idx";

-- DropIndex
DROP INDEX "crm"."leads_status_idx";

-- DropIndex
DROP INDEX "crm"."leads_assigned_to_id_idx";

-- DropIndex
DROP INDEX "crm"."leads_phone_idx";

-- DropIndex
DROP INDEX "crm"."lead_activities_org_id_idx";

-- DropIndex
DROP INDEX "crm"."lead_activities_lead_id_idx";

-- DropIndex
DROP INDEX "crm"."admissions_org_id_idx";

-- DropIndex
DROP INDEX "crm"."admissions_status_idx";

-- DropIndex
DROP INDEX "crm"."admissions_stage_id_idx";

-- DropIndex
DROP INDEX "crm"."admissions_assigned_to_id_idx";

-- DropIndex
DROP INDEX "crm"."admission_activities_org_id_idx";

-- DropIndex
DROP INDEX "crm"."admission_activities_admission_id_idx";

-- DropIndex
DROP INDEX "crm"."students_org_id_idx";

-- DropIndex
DROP INDEX "crm"."students_status_idx";

-- DropIndex
DROP INDEX "crm"."invoices_org_id_idx";

-- DropIndex
DROP INDEX "crm"."invoices_student_id_idx";

-- DropIndex
DROP INDEX "crm"."invoices_status_idx";

-- DropIndex
DROP INDEX "crm"."invoices_due_date_idx";

-- DropIndex
DROP INDEX "crm"."payments_org_id_idx";

-- DropIndex
DROP INDEX "crm"."payments_invoice_id_idx";

-- DropIndex
DROP INDEX "crm"."payments_student_id_idx";

-- DropIndex
DROP INDEX "crm"."payments_status_idx";

-- DropIndex
DROP INDEX "crm"."notifications_org_id_idx";

-- DropIndex
DROP INDEX "crm"."notifications_recipient_type_recipient_id_idx";

-- DropIndex
DROP INDEX "crm"."notifications_read_at_idx";

-- CreateIndex
CREATE INDEX "leads_org_id_created_at_idx" ON "crm"."leads"("org_id", "created_at");

-- CreateIndex
CREATE INDEX "leads_org_id_status_idx" ON "crm"."leads"("org_id", "status");

-- CreateIndex
CREATE INDEX "leads_org_id_assigned_to_id_idx" ON "crm"."leads"("org_id", "assigned_to_id");

-- CreateIndex
CREATE INDEX "leads_org_id_phone_idx" ON "crm"."leads"("org_id", "phone");

-- CreateIndex
CREATE INDEX "lead_activities_org_id_lead_id_created_at_idx" ON "crm"."lead_activities"("org_id", "lead_id", "created_at");

-- CreateIndex
CREATE INDEX "admissions_org_id_created_at_idx" ON "crm"."admissions"("org_id", "created_at");

-- CreateIndex
CREATE INDEX "admissions_org_id_status_idx" ON "crm"."admissions"("org_id", "status");

-- CreateIndex
CREATE INDEX "admissions_org_id_stage_id_idx" ON "crm"."admissions"("org_id", "stage_id");

-- CreateIndex
CREATE INDEX "admissions_org_id_assigned_to_id_idx" ON "crm"."admissions"("org_id", "assigned_to_id");

-- CreateIndex
CREATE INDEX "admission_activities_org_id_admission_id_created_at_idx" ON "crm"."admission_activities"("org_id", "admission_id", "created_at");

-- CreateIndex
CREATE INDEX "students_org_id_created_at_idx" ON "crm"."students"("org_id", "created_at");

-- CreateIndex
CREATE INDEX "students_org_id_status_idx" ON "crm"."students"("org_id", "status");

-- CreateIndex
CREATE INDEX "students_org_id_grade_label_idx" ON "crm"."students"("org_id", "grade_label");

-- CreateIndex
CREATE INDEX "invoices_org_id_created_at_idx" ON "crm"."invoices"("org_id", "created_at");

-- CreateIndex
CREATE INDEX "invoices_org_id_status_idx" ON "crm"."invoices"("org_id", "status");

-- CreateIndex
CREATE INDEX "invoices_org_id_student_id_idx" ON "crm"."invoices"("org_id", "student_id");

-- CreateIndex
CREATE INDEX "invoices_org_id_due_date_idx" ON "crm"."invoices"("org_id", "due_date");

-- CreateIndex
CREATE INDEX "invoices_org_id_invoice_type_idx" ON "crm"."invoices"("org_id", "invoice_type");

-- CreateIndex
CREATE INDEX "payments_org_id_paid_at_idx" ON "crm"."payments"("org_id", "paid_at");

-- CreateIndex
CREATE INDEX "payments_org_id_status_idx" ON "crm"."payments"("org_id", "status");

-- CreateIndex
CREATE INDEX "payments_org_id_invoice_id_idx" ON "crm"."payments"("org_id", "invoice_id");

-- CreateIndex
CREATE INDEX "payments_org_id_student_id_idx" ON "crm"."payments"("org_id", "student_id");

-- CreateIndex
CREATE INDEX "notifications_org_id_recipient_type_recipient_id_created_at_idx" ON "crm"."notifications"("org_id", "recipient_type", "recipient_id", "created_at");

-- CreateIndex
CREATE INDEX "notifications_org_id_recipient_type_recipient_id_read_at_idx" ON "crm"."notifications"("org_id", "recipient_type", "recipient_id", "read_at");

