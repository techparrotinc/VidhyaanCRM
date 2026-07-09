-- CreateTable
CREATE TABLE "crm"."households" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "phone_normalized" TEXT NOT NULL,
    "primary_name" TEXT,
    "primary_email" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "households_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "households_org_id_idx" ON "crm"."households"("org_id");
CREATE UNIQUE INDEX "households_org_id_phone_normalized_key" ON "crm"."households"("org_id", "phone_normalized");

-- AlterTable
ALTER TABLE "crm"."leads" ADD COLUMN "phone_normalized" TEXT,
                          ADD COLUMN "household_id" TEXT;
ALTER TABLE "crm"."admissions" ADD COLUMN "phone_normalized" TEXT,
                               ADD COLUMN "household_id" TEXT;
ALTER TABLE "crm"."students" ADD COLUMN "phone_normalized" TEXT,
                             ADD COLUMN "household_id" TEXT;

-- CreateIndex
CREATE INDEX "leads_org_id_phone_normalized_idx" ON "crm"."leads"("org_id", "phone_normalized");
CREATE INDEX "leads_household_id_idx" ON "crm"."leads"("household_id");
CREATE INDEX "admissions_org_id_phone_normalized_idx" ON "crm"."admissions"("org_id", "phone_normalized");
CREATE INDEX "admissions_household_id_idx" ON "crm"."admissions"("household_id");
CREATE INDEX "students_org_id_phone_normalized_idx" ON "crm"."students"("org_id", "phone_normalized");
CREATE INDEX "students_household_id_idx" ON "crm"."students"("household_id");

-- AddForeignKey
ALTER TABLE "crm"."households" ADD CONSTRAINT "households_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "platform"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "crm"."leads" ADD CONSTRAINT "leads_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "crm"."households"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "crm"."admissions" ADD CONSTRAINT "admissions_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "crm"."households"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "crm"."students" ADD CONSTRAINT "students_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "crm"."households"("id") ON DELETE SET NULL ON UPDATE CASCADE;
