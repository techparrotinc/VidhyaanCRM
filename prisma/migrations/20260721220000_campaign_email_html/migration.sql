-- Rich-text WYSIWYG body for EMAIL campaigns (sanitized HTML).
ALTER TABLE "crm"."campaigns" ADD COLUMN IF NOT EXISTS "email_html" TEXT;
