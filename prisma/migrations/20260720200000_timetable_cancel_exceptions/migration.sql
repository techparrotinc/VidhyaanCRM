-- AlterTable
ALTER TABLE "crm"."timetable_slots" ADD COLUMN     "cancel_reason" TEXT,
ADD COLUMN     "cancelled_at" TIMESTAMP(3),
ADD COLUMN     "cancelled_by_id" TEXT;
-- CreateTable
CREATE TABLE "crm"."timetable_exceptions" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "slot_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "reason" TEXT,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "timetable_exceptions_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE INDEX "timetable_exceptions_org_id_date_idx" ON "crm"."timetable_exceptions"("org_id", "date");
-- CreateIndex
CREATE UNIQUE INDEX "timetable_exceptions_slot_id_date_key" ON "crm"."timetable_exceptions"("slot_id", "date");
-- AddForeignKey
ALTER TABLE "crm"."timetable_exceptions" ADD CONSTRAINT "timetable_exceptions_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "platform"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "crm"."timetable_exceptions" ADD CONSTRAINT "timetable_exceptions_slot_id_fkey" FOREIGN KEY ("slot_id") REFERENCES "crm"."timetable_slots"("id") ON DELETE CASCADE ON UPDATE CASCADE;
