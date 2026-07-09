-- AlterTable
ALTER TABLE "reporting"."report_schedules" ADD COLUMN     "last_error" TEXT,
ADD COLUMN     "last_run_at" TIMESTAMP(3),
ADD COLUMN     "last_status" TEXT;
