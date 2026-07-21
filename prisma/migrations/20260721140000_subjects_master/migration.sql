-- CreateTable
CREATE TABLE "crm"."subjects" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE INDEX "subjects_org_id_sort_order_idx" ON "crm"."subjects"("org_id", "sort_order");
-- CreateIndex
CREATE UNIQUE INDEX "subjects_org_id_name_key" ON "crm"."subjects"("org_id", "name");
-- AddForeignKey
ALTER TABLE "crm"."subjects" ADD CONSTRAINT "subjects_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "platform"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
