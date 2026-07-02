-- AlterTable
ALTER TABLE "marketplace"."schools" ADD COLUMN     "is_dummy" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "platform"."organizations" ADD COLUMN     "is_dummy" BOOLEAN NOT NULL DEFAULT false;
