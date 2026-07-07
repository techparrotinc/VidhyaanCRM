CREATE TABLE "crm"."org_email_templates" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "updated_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "org_email_templates_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "org_email_templates_org_id_key_key" ON "crm"."org_email_templates"("org_id", "key");
ALTER TABLE "crm"."org_email_templates" ADD CONSTRAINT "org_email_templates_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "platform"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
