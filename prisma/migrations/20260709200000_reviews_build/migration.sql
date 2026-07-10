-- AlterTable: institution-type-adaptive sub-ratings + pros/cons tags + verified-admission badge
-- All additive & nullable/defaulted; existing school_reviews rows are untouched.
ALTER TABLE "marketplace"."school_reviews"
  ADD COLUMN "sub_ratings" JSONB,
  ADD COLUMN "pros" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "cons" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "is_verified_admission" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable: user-submitted reports; N distinct reports auto-flag a review
CREATE TABLE "marketplace"."review_reports" (
    "id" TEXT NOT NULL,
    "review_id" TEXT NOT NULL,
    "reporter_parent_id" TEXT,
    "reporter_key" TEXT,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "review_reports_review_id_reporter_parent_id_key" ON "marketplace"."review_reports"("review_id", "reporter_parent_id");
CREATE INDEX "review_reports_review_id_idx" ON "marketplace"."review_reports"("review_id");

-- AddForeignKey
ALTER TABLE "marketplace"."review_reports" ADD CONSTRAINT "review_reports_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "marketplace"."school_reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;
