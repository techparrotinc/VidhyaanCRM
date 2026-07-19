-- Authorized signatory + rubber stamp images for platform GST invoices
ALTER TABLE "platform"."platform_settings" ADD COLUMN "signatory_name" TEXT;
ALTER TABLE "platform"."platform_settings" ADD COLUMN "signatory_image_url" TEXT;
ALTER TABLE "platform"."platform_settings" ADD COLUMN "stamp_image_url" TEXT;
