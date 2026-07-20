-- AlterTable
ALTER TABLE "crm"."attendance_sessions" ADD COLUMN     "enrollment_id" TEXT,
ADD COLUMN     "schedule_slot_id" TEXT,
ADD COLUMN     "student_id" TEXT;
-- AlterTable
ALTER TABLE "crm"."course_sessions" ADD COLUMN     "enrollment_id" TEXT,
ADD COLUMN     "schedule_slot_id" TEXT,
ADD COLUMN     "student_id" TEXT,
ALTER COLUMN "batch_id" DROP NOT NULL;
-- AlterTable
ALTER TABLE "crm"."courses" ADD COLUMN     "hours_per_week" INTEGER,
ADD COLUMN     "total_hours" INTEGER;
-- CreateTable
CREATE TABLE "crm"."enrollment_schedule_slots" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "enrollment_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "duration_min" INTEGER,
    "teacher_id" TEXT,
    "room" TEXT,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "enrollment_schedule_slots_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE INDEX "enrollment_schedule_slots_org_id_idx" ON "crm"."enrollment_schedule_slots"("org_id");
-- CreateIndex
CREATE INDEX "enrollment_schedule_slots_student_id_idx" ON "crm"."enrollment_schedule_slots"("student_id");
-- CreateIndex
CREATE INDEX "enrollment_schedule_slots_enrollment_id_idx" ON "crm"."enrollment_schedule_slots"("enrollment_id");
-- CreateIndex
CREATE UNIQUE INDEX "enrollment_schedule_slots_enrollment_id_day_of_week_start_t_key" ON "crm"."enrollment_schedule_slots"("enrollment_id", "day_of_week", "start_time");
-- CreateIndex
CREATE INDEX "attendance_sessions_student_id_idx" ON "crm"."attendance_sessions"("student_id");
-- CreateIndex
CREATE INDEX "course_sessions_student_id_starts_at_idx" ON "crm"."course_sessions"("student_id", "starts_at");
-- CreateIndex
CREATE UNIQUE INDEX "course_sessions_schedule_slot_id_starts_at_key" ON "crm"."course_sessions"("schedule_slot_id", "starts_at");
-- AddForeignKey
ALTER TABLE "crm"."enrollment_schedule_slots" ADD CONSTRAINT "enrollment_schedule_slots_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "platform"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "crm"."enrollment_schedule_slots" ADD CONSTRAINT "enrollment_schedule_slots_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "crm"."course_enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "crm"."enrollment_schedule_slots" ADD CONSTRAINT "enrollment_schedule_slots_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "crm"."students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "crm"."enrollment_schedule_slots" ADD CONSTRAINT "enrollment_schedule_slots_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "crm"."courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
