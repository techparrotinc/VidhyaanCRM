-- AlterTable
ALTER TABLE "marketplace"."parents" ADD COLUMN     "phone_history" TEXT[] DEFAULT ARRAY[]::TEXT[];
