-- Holiday.source: CUSTOM (org-added) | NATIONAL (seeded from platform list)
ALTER TABLE "crm"."holidays" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'CUSTOM';
