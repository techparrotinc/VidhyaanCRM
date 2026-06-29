-- CreateTable
CREATE TABLE "crm"."student_activities" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "type" "crm"."ActivityType" NOT NULL,
    "summary" TEXT NOT NULL,
    "note" TEXT,
    "performed_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "student_activities_student_id_idx" ON "crm"."student_activities"("student_id");

-- CreateIndex
CREATE INDEX "student_activities_performed_by_id_idx" ON "crm"."student_activities"("performed_by_id");

-- AddForeignKey
ALTER TABLE "crm"."student_activities" ADD CONSTRAINT "student_activities_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "crm"."students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."student_activities" ADD CONSTRAINT "student_activities_performed_by_id_fkey" FOREIGN KEY ("performed_by_id") REFERENCES "platform"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
