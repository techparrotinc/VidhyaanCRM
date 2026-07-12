-- AlterTable
ALTER TABLE "crm"."student_batches" ADD COLUMN     "course_id" TEXT,
ADD COLUMN     "days_of_week" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "end_time" TEXT,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "start_time" TEXT;

-- CreateTable
CREATE TABLE "crm"."school_classes" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "branch_id" TEXT,
    "name" TEXT NOT NULL,
    "grade_slug" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "school_classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm"."class_sections" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "class_sections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "school_classes_org_id_sort_order_idx" ON "crm"."school_classes"("org_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "school_classes_org_id_name_key" ON "crm"."school_classes"("org_id", "name");

-- CreateIndex
CREATE INDEX "class_sections_org_id_idx" ON "crm"."class_sections"("org_id");

-- CreateIndex
CREATE UNIQUE INDEX "class_sections_class_id_name_key" ON "crm"."class_sections"("class_id", "name");

-- AddForeignKey
ALTER TABLE "crm"."student_batches" ADD CONSTRAINT "student_batches_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "crm"."courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."school_classes" ADD CONSTRAINT "school_classes_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "platform"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."school_classes" ADD CONSTRAINT "school_classes_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "platform"."branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."class_sections" ADD CONSTRAINT "class_sections_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "platform"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."class_sections" ADD CONSTRAINT "class_sections_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "crm"."school_classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

