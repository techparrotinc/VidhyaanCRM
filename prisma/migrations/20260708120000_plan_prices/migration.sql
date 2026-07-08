-- CreateEnum
CREATE TYPE "billing"."StudentSlab" AS ENUM ('S50', 'S100', 'S200', 'S500', 'S500_PLUS');

-- CreateTable
CREATE TABLE "billing"."plan_prices" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "slab" "billing"."StudentSlab" NOT NULL,
    "monthly_price" DECIMAL(12,2) NOT NULL,
    "annual_price" DECIMAL(12,2) NOT NULL,
    "launch_monthly" DECIMAL(12,2),
    "bundled_ai_credits" INTEGER NOT NULL DEFAULT 0,
    "overage_per_student" DECIMAL(12,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plan_prices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "plan_prices_plan_id_idx" ON "billing"."plan_prices"("plan_id");

-- CreateIndex
CREATE UNIQUE INDEX "plan_prices_plan_id_slab_key" ON "billing"."plan_prices"("plan_id", "slab");

-- AddForeignKey
ALTER TABLE "billing"."plan_prices" ADD CONSTRAINT "plan_prices_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "billing"."plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

