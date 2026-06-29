-- AlterEnum
ALTER TYPE "crm"."InvoiceStatus" ADD VALUE 'SCHEDULED';

-- AlterTable
ALTER TABLE "crm"."invoices" ADD COLUMN     "batch_id" TEXT,
ADD COLUMN     "scheduled_date" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "invoices_batch_id_idx" ON "crm"."invoices"("batch_id");
