-- AlterTable
ALTER TABLE "crm"."events" ADD COLUMN     "capacity" INTEGER,
ADD COLUMN     "is_published" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "type" TEXT;

-- CreateIndex
CREATE INDEX "events_org_id_starts_at_idx" ON "crm"."events"("org_id", "starts_at");
