-- AlterTable: per-kid reviews — a parent may review the same school once per
-- child (and again after 6 months). Both columns nullable; legacy rows keep NULL.
ALTER TABLE "marketplace"."school_reviews"
  ADD COLUMN "kid_id" TEXT,
  ADD COLUMN "class_or_course" TEXT;

-- AddForeignKey (kid profile lives in the same marketplace schema)
ALTER TABLE "marketplace"."school_reviews" ADD CONSTRAINT "school_reviews_kid_id_fkey" FOREIGN KEY ("kid_id") REFERENCES "marketplace"."kids_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex: dedup / lookup path (parent+school+kid)
CREATE INDEX "school_reviews_parent_id_school_id_kid_id_idx" ON "marketplace"."school_reviews"("parent_id", "school_id", "kid_id");
