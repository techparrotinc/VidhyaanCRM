ALTER TABLE "crm"."events" ADD COLUMN "image_url" TEXT;
ALTER TABLE "crm"."events" ADD COLUMN "published_at" TIMESTAMP(3);
ALTER TABLE "crm"."events" ADD COLUMN "audience" TEXT;

CREATE TABLE "crm"."event_announcements" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "channels" TEXT[],
    "audience" TEXT NOT NULL,
    "recipient_count" INTEGER NOT NULL DEFAULT 0,
    "sent_count" INTEGER NOT NULL DEFAULT 0,
    "failed_count" INTEGER NOT NULL DEFAULT 0,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "event_announcements_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "event_announcements_org_id_idx" ON "crm"."event_announcements"("org_id");
CREATE INDEX "event_announcements_event_id_idx" ON "crm"."event_announcements"("event_id");
ALTER TABLE "crm"."event_announcements" ADD CONSTRAINT "event_announcements_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "crm"."events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
