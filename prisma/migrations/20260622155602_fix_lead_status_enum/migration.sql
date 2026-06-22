/*
  Warnings:

  - The values [QUALIFIED,FOLLOW_UP,VISIT_SCHEDULED,VISITED,APPLICATION_STARTED,NURTURING,LOST,JUNK] on the enum `LeadStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;

-- Alter column to TEXT temporarily
ALTER TABLE "crm"."leads" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "crm"."leads" ALTER COLUMN "status" TYPE TEXT USING ("status"::text);

-- Drop old enum type
DROP TYPE "crm"."LeadStatus";

-- Create new enum type
CREATE TYPE "crm"."LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'INTERESTED', 'FOLLOW_UP_PENDING', 'CONVERTED', 'NOT_INTERESTED');

-- Update status values in the text column
UPDATE "crm"."leads" SET "status" = 'INTERESTED' WHERE "status" IN ('QUALIFIED', 'VISIT_SCHEDULED', 'VISITED', 'APPLICATION_STARTED', 'NURTURING');
UPDATE "crm"."leads" SET "status" = 'FOLLOW_UP_PENDING' WHERE "status" = 'FOLLOW_UP';
UPDATE "crm"."leads" SET "status" = 'NOT_INTERESTED' WHERE "status" IN ('LOST', 'JUNK');

-- Cast column back to the new enum type
ALTER TABLE "crm"."leads" ALTER COLUMN "status" TYPE "crm"."LeadStatus" USING ("status"::"crm"."LeadStatus");
ALTER TABLE "crm"."leads" ALTER COLUMN "status" SET DEFAULT 'NEW';

COMMIT;
