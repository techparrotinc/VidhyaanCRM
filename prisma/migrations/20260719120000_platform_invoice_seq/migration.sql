-- Platform GST-invoice number sequence (receipt "VID<year>-<seq>")
ALTER TABLE "platform"."platform_settings" ADD COLUMN "invoice_seq" INTEGER NOT NULL DEFAULT 0;
