-- AlterTable
ALTER TABLE "marketplace"."schools" ADD COLUMN     "enquiry_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "established_year" INTEGER,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "grades_offered" TEXT,
ADD COLUMN     "is_claimed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_managed_by_school" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_published" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "medium_of_instruction" TEXT,
ADD COLUMN     "school_type" TEXT,
ADD COLUMN     "total_students" INTEGER,
ADD COLUMN     "total_teachers" INTEGER,
ADD COLUMN     "view_count" INTEGER NOT NULL DEFAULT 0;
