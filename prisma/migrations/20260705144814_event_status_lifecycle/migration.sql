-- CreateEnum
CREATE TYPE "crm"."EventStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CANCELLED');

-- AlterTable
ALTER TABLE "crm"."events" ADD COLUMN     "status" "crm"."EventStatus" NOT NULL DEFAULT 'DRAFT';
