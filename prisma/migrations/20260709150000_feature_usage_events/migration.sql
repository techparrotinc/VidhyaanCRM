-- CreateTable
CREATE TABLE "platform"."feature_usage_events" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "user_id" TEXT,
    "feature" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "path" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feature_usage_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "feature_usage_events_org_id_feature_created_at_idx" ON "platform"."feature_usage_events"("org_id", "feature", "created_at");

-- CreateIndex
CREATE INDEX "feature_usage_events_org_id_created_at_idx" ON "platform"."feature_usage_events"("org_id", "created_at");
