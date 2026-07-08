-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "reporting";

-- CreateTable
CREATE TABLE "reporting"."daily_rollups" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "branch_id" TEXT,
    "academic_year_id" TEXT,
    "date" DATE NOT NULL,
    "metric" TEXT NOT NULL,
    "dimension" TEXT,
    "dimension_value" TEXT,
    "count" INTEGER NOT NULL DEFAULT 0,
    "amount" DECIMAL(12,2),

    CONSTRAINT "daily_rollups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reporting"."report_saved_views" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "report_key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "filters" JSONB NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_saved_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reporting"."report_usage" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "report_key" TEXT NOT NULL,
    "is_favourite" BOOLEAN NOT NULL DEFAULT false,
    "last_viewed_at" TIMESTAMP(3),
    "view_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "report_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reporting"."report_schedules" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "report_key" TEXT NOT NULL,
    "saved_view_id" TEXT,
    "cadence" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'email',
    "recipients" JSONB NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "daily_rollups_org_id_metric_date_idx" ON "reporting"."daily_rollups"("org_id", "metric", "date");

-- CreateIndex
CREATE INDEX "daily_rollups_org_id_academic_year_id_metric_idx" ON "reporting"."daily_rollups"("org_id", "academic_year_id", "metric");

-- CreateIndex
CREATE INDEX "daily_rollups_org_id_date_idx" ON "reporting"."daily_rollups"("org_id", "date");

-- CreateIndex
CREATE INDEX "report_saved_views_org_id_user_id_idx" ON "reporting"."report_saved_views"("org_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "report_saved_views_user_id_report_key_name_key" ON "reporting"."report_saved_views"("user_id", "report_key", "name");

-- CreateIndex
CREATE INDEX "report_usage_org_id_user_id_last_viewed_at_idx" ON "reporting"."report_usage"("org_id", "user_id", "last_viewed_at");

-- CreateIndex
CREATE UNIQUE INDEX "report_usage_user_id_report_key_key" ON "reporting"."report_usage"("user_id", "report_key");

-- CreateIndex
CREATE INDEX "report_schedules_org_id_enabled_idx" ON "reporting"."report_schedules"("org_id", "enabled");

-- CreateIndex
CREATE INDEX "invoices_org_id_status_due_date_idx" ON "crm"."invoices"("org_id", "status", "due_date");

-- CreateIndex
CREATE INDEX "leads_org_id_source_status_idx" ON "crm"."leads"("org_id", "source", "status");

-- CreateIndex
CREATE INDEX "leads_org_id_next_follow_up_at_idx" ON "crm"."leads"("org_id", "next_follow_up_at");
