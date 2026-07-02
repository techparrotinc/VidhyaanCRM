-- CreateExtension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- CreateIndex
CREATE INDEX "school_locations_address_line_idx" ON "marketplace"."school_locations" USING GIN ("address_line" gin_trgm_ops);
