-- CreateEnum
CREATE TYPE "crm"."GuardianLinkStatus" AS ENUM ('INVITED', 'ACTIVE', 'REVOKED');

-- CreateTable
CREATE TABLE "crm"."student_guardian_links" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "parent_id" TEXT NOT NULL,
    "relation" TEXT,
    "status" "crm"."GuardianLinkStatus" NOT NULL DEFAULT 'INVITED',
    "invited_by_id" TEXT,
    "invited_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activated_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_guardian_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "student_guardian_links_org_id_student_id_idx" ON "crm"."student_guardian_links"("org_id", "student_id");

-- CreateIndex
CREATE INDEX "student_guardian_links_parent_id_status_idx" ON "crm"."student_guardian_links"("parent_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "student_guardian_links_student_id_parent_id_key" ON "crm"."student_guardian_links"("student_id", "parent_id");

-- AddForeignKey
ALTER TABLE "crm"."student_guardian_links" ADD CONSTRAINT "student_guardian_links_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "platform"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."student_guardian_links" ADD CONSTRAINT "student_guardian_links_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "crm"."students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."student_guardian_links" ADD CONSTRAINT "student_guardian_links_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "marketplace"."parents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

