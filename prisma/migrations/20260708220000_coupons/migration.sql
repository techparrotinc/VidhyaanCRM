-- CreateTable
CREATE TABLE "billing"."coupons" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "percent_off" INTEGER NOT NULL,
    "max_redemptions" INTEGER,
    "expires_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing"."coupon_redemptions" (
    "id" TEXT NOT NULL,
    "coupon_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "transaction_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coupon_redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "coupons_code_key" ON "billing"."coupons"("code");

-- CreateIndex
CREATE INDEX "coupon_redemptions_org_id_idx" ON "billing"."coupon_redemptions"("org_id");

-- CreateIndex
CREATE UNIQUE INDEX "coupon_redemptions_coupon_id_org_id_key" ON "billing"."coupon_redemptions"("coupon_id", "org_id");

-- AddForeignKey
ALTER TABLE "billing"."coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "billing"."coupons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

