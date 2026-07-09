-- CreateTable
CREATE TABLE "platform"."usage_heartbeats" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_heartbeats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "usage_heartbeats_org_id_created_at_idx" ON "platform"."usage_heartbeats"("org_id", "created_at");

-- CreateIndex
CREATE INDEX "usage_heartbeats_org_id_user_id_feature_created_at_idx" ON "platform"."usage_heartbeats"("org_id", "user_id", "feature", "created_at");

-- AlterTable: usage & ROI cost model
ALTER TABLE "platform"."platform_settings"
  ADD COLUMN "usage_hourly_rate" INTEGER DEFAULT 300,
  ADD COLUMN "usage_minutes_per_action" JSONB;
