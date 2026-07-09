-- CreateTable: pre-aggregated daily usage rollups
CREATE TABLE "platform"."usage_daily_rollups" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "feature" TEXT NOT NULL,
    "actions" INTEGER NOT NULL DEFAULT 0,
    "active_users" INTEGER NOT NULL DEFAULT 0,
    "active_minutes" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usage_daily_rollups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usage_daily_rollups_org_id_day_feature_key" ON "platform"."usage_daily_rollups"("org_id", "day", "feature");
CREATE INDEX "usage_daily_rollups_org_id_day_idx" ON "platform"."usage_daily_rollups"("org_id", "day");

-- AlterTable: optional external uptime monitor key
ALTER TABLE "platform"."platform_settings" ADD COLUMN "uptime_robot_api_key_enc" TEXT;
