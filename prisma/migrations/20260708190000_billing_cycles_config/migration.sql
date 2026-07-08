-- AlterTable
ALTER TABLE "platform"."platform_settings" ADD COLUMN     "enabled_billing_cycles" "billing"."BillingCycle"[] DEFAULT ARRAY['MONTHLY', 'ANNUAL']::"billing"."BillingCycle"[];

