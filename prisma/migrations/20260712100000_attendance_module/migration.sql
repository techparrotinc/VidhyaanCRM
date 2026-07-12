-- CreateEnum
CREATE TYPE "crm"."AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE', 'HOLIDAY');

-- CreateEnum
CREATE TYPE "crm"."AttendanceSource" AS ENUM ('MANUAL', 'BIOMETRIC', 'AUTO_ONLINE', 'API');

-- CreateTable
CREATE TABLE "crm"."attendance_records" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "branch_id" TEXT,
    "academic_year_id" TEXT,
    "student_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "session_id" TEXT,
    "session_key" TEXT NOT NULL DEFAULT 'DAY',
    "status" "crm"."AttendanceStatus" NOT NULL,
    "source" "crm"."AttendanceSource" NOT NULL DEFAULT 'MANUAL',
    "check_in_at" TIMESTAMP(3),
    "check_out_at" TIMESTAMP(3),
    "note" TEXT,
    "marked_by_id" TEXT,
    "updated_by_id" TEXT,
    "alert_sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm"."attendance_sessions" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "branch_id" TEXT,
    "academic_year_id" TEXT,
    "date" DATE NOT NULL,
    "course_id" TEXT,
    "batch_id" TEXT,
    "title" TEXT,
    "starts_at" TIMESTAMP(3),
    "ends_at" TIMESTAMP(3),
    "delivery_mode" TEXT NOT NULL DEFAULT 'IN_PERSON',
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm"."teacher_assignments" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "academic_year_id" TEXT,
    "grade_label" TEXT,
    "section" TEXT,
    "course_id" TEXT,
    "batch_id" TEXT,
    "target_key" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teacher_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm"."holidays" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "academic_year_id" TEXT,
    "date" DATE NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "holidays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm"."biometric_devices" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "branch_id" TEXT,
    "name" TEXT NOT NULL,
    "vendor" TEXT,
    "serial_number" TEXT,
    "api_key_prefix" TEXT NOT NULL,
    "api_key_hash" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_seen_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "biometric_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm"."biometric_identities" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "device_id" TEXT,
    "device_user_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "biometric_identities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm"."biometric_events" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "device_user_id" TEXT NOT NULL,
    "event_at" TIMESTAMP(3) NOT NULL,
    "direction" TEXT,
    "payload" JSONB,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "student_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "biometric_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "attendance_records_org_id_date_idx" ON "crm"."attendance_records"("org_id", "date");

-- CreateIndex
CREATE INDEX "attendance_records_org_id_academic_year_id_date_idx" ON "crm"."attendance_records"("org_id", "academic_year_id", "date");

-- CreateIndex
CREATE INDEX "attendance_records_org_id_student_id_date_idx" ON "crm"."attendance_records"("org_id", "student_id", "date");

-- CreateIndex
CREATE INDEX "attendance_records_session_id_idx" ON "crm"."attendance_records"("session_id");

-- CreateIndex
CREATE INDEX "attendance_records_branch_id_idx" ON "crm"."attendance_records"("branch_id");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_records_org_id_student_id_date_session_key_key" ON "crm"."attendance_records"("org_id", "student_id", "date", "session_key");

-- CreateIndex
CREATE INDEX "attendance_sessions_org_id_date_idx" ON "crm"."attendance_sessions"("org_id", "date");

-- CreateIndex
CREATE INDEX "attendance_sessions_course_id_idx" ON "crm"."attendance_sessions"("course_id");

-- CreateIndex
CREATE INDEX "attendance_sessions_batch_id_idx" ON "crm"."attendance_sessions"("batch_id");

-- CreateIndex
CREATE INDEX "teacher_assignments_org_id_teacher_id_idx" ON "crm"."teacher_assignments"("org_id", "teacher_id");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_assignments_org_id_teacher_id_target_key_key" ON "crm"."teacher_assignments"("org_id", "teacher_id", "target_key");

-- CreateIndex
CREATE INDEX "holidays_org_id_academic_year_id_idx" ON "crm"."holidays"("org_id", "academic_year_id");

-- CreateIndex
CREATE UNIQUE INDEX "holidays_org_id_date_key" ON "crm"."holidays"("org_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "biometric_devices_api_key_hash_key" ON "crm"."biometric_devices"("api_key_hash");

-- CreateIndex
CREATE INDEX "biometric_devices_org_id_idx" ON "crm"."biometric_devices"("org_id");

-- CreateIndex
CREATE INDEX "biometric_identities_student_id_idx" ON "crm"."biometric_identities"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "biometric_identities_org_id_device_user_id_key" ON "crm"."biometric_identities"("org_id", "device_user_id");

-- CreateIndex
CREATE INDEX "biometric_events_org_id_status_idx" ON "crm"."biometric_events"("org_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "biometric_events_device_id_device_user_id_event_at_key" ON "crm"."biometric_events"("device_id", "device_user_id", "event_at");

-- AddForeignKey
ALTER TABLE "crm"."attendance_records" ADD CONSTRAINT "attendance_records_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "platform"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."attendance_records" ADD CONSTRAINT "attendance_records_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "crm"."students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."attendance_records" ADD CONSTRAINT "attendance_records_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "crm"."attendance_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."attendance_records" ADD CONSTRAINT "attendance_records_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "crm"."academic_years"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."attendance_records" ADD CONSTRAINT "attendance_records_marked_by_id_fkey" FOREIGN KEY ("marked_by_id") REFERENCES "platform"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."attendance_sessions" ADD CONSTRAINT "attendance_sessions_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "platform"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."attendance_sessions" ADD CONSTRAINT "attendance_sessions_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "crm"."courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."attendance_sessions" ADD CONSTRAINT "attendance_sessions_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "crm"."student_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."teacher_assignments" ADD CONSTRAINT "teacher_assignments_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "platform"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."teacher_assignments" ADD CONSTRAINT "teacher_assignments_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "platform"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."teacher_assignments" ADD CONSTRAINT "teacher_assignments_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "crm"."courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."teacher_assignments" ADD CONSTRAINT "teacher_assignments_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "crm"."student_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."holidays" ADD CONSTRAINT "holidays_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "platform"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."biometric_devices" ADD CONSTRAINT "biometric_devices_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "platform"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."biometric_identities" ADD CONSTRAINT "biometric_identities_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "platform"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."biometric_identities" ADD CONSTRAINT "biometric_identities_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "crm"."biometric_devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."biometric_identities" ADD CONSTRAINT "biometric_identities_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "crm"."students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."biometric_events" ADD CONSTRAINT "biometric_events_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "crm"."biometric_devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

