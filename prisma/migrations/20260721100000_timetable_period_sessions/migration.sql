-- AlterTable
ALTER TABLE "crm"."attendance_sessions" ADD COLUMN     "grade_label" TEXT,
ADD COLUMN     "section" TEXT,
ADD COLUMN     "subject" TEXT,
ADD COLUMN     "timetable_slot_id" TEXT;
-- AlterTable
ALTER TABLE "crm"."course_sessions" ADD COLUMN     "grade_label" TEXT,
ADD COLUMN     "section" TEXT,
ADD COLUMN     "subject" TEXT,
ADD COLUMN     "timetable_slot_id" TEXT;
-- CreateIndex
CREATE INDEX "attendance_sessions_timetable_slot_id_idx" ON "crm"."attendance_sessions"("timetable_slot_id");
-- CreateIndex
CREATE UNIQUE INDEX "course_sessions_timetable_slot_id_starts_at_key" ON "crm"."course_sessions"("timetable_slot_id", "starts_at");
