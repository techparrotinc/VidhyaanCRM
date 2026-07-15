-- AlterTable
ALTER TABLE "crm"."student_batches" ADD COLUMN "session_duration_min" INTEGER;

-- CreateEnum
CREATE TYPE "crm"."CourseSessionStatus" AS ENUM ('SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "crm"."course_sessions" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "branch_id" TEXT,
    "academic_year_id" TEXT,
    "course_id" TEXT,
    "batch_id" TEXT NOT NULL,
    "teacher_id" TEXT,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "duration_min" INTEGER NOT NULL,
    "status" "crm"."CourseSessionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "meeting_link" TEXT,
    "rescheduled_from_id" TEXT,
    "cancel_reason" TEXT,
    "attendance_session_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "course_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "course_sessions_batch_id_starts_at_key" ON "crm"."course_sessions"("batch_id", "starts_at");

-- CreateIndex
CREATE INDEX "course_sessions_org_id_starts_at_idx" ON "crm"."course_sessions"("org_id", "starts_at");

-- CreateIndex
CREATE INDEX "course_sessions_teacher_id_starts_at_idx" ON "crm"."course_sessions"("teacher_id", "starts_at");

-- CreateIndex
CREATE INDEX "course_sessions_course_id_idx" ON "crm"."course_sessions"("course_id");

-- AddForeignKey
ALTER TABLE "crm"."course_sessions" ADD CONSTRAINT "course_sessions_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "platform"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."course_sessions" ADD CONSTRAINT "course_sessions_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "crm"."courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."course_sessions" ADD CONSTRAINT "course_sessions_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "crm"."student_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
