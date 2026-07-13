-- CreateTable
CREATE TABLE "crm"."leave_requests" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "parent_id" TEXT NOT NULL,
    "from_date" DATE NOT NULL,
    "to_date" DATE NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "review_note" TEXT,
    "reviewed_by_id" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leave_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm"."exam_results" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "academic_year_id" TEXT,
    "term_id" TEXT,
    "exam_name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "max_marks" DECIMAL(6,2) NOT NULL DEFAULT 100,
    "marks_obtained" DECIMAL(6,2) NOT NULL,
    "grade" TEXT,
    "remarks" TEXT,
    "exam_date" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exam_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "leave_requests_org_id_student_id_idx" ON "crm"."leave_requests"("org_id", "student_id");

-- CreateIndex
CREATE INDEX "leave_requests_org_id_status_idx" ON "crm"."leave_requests"("org_id", "status");

-- CreateIndex
CREATE INDEX "exam_results_org_id_student_id_idx" ON "crm"."exam_results"("org_id", "student_id");

-- CreateIndex
CREATE UNIQUE INDEX "exam_results_student_id_exam_name_subject_key" ON "crm"."exam_results"("student_id", "exam_name", "subject");

-- AddForeignKey
ALTER TABLE "crm"."leave_requests" ADD CONSTRAINT "leave_requests_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "platform"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."leave_requests" ADD CONSTRAINT "leave_requests_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "crm"."students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."exam_results" ADD CONSTRAINT "exam_results_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "platform"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."exam_results" ADD CONSTRAINT "exam_results_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "crm"."students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
