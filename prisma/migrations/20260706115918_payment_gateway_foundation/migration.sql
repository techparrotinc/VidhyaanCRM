-- CreateEnum
CREATE TYPE "billing"."GatewayProvider" AS ENUM ('RAZORPAY', 'STRIPE', 'CASHFREE', 'PAYU');

-- CreateEnum
CREATE TYPE "billing"."GatewayEnvironment" AS ENUM ('TEST', 'LIVE');

-- CreateEnum
CREATE TYPE "billing"."GatewayConfigStatus" AS ENUM ('DRAFT', 'VERIFIED', 'ACTIVE', 'DISABLED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "billing"."GatewayOrderStatus" AS ENUM ('CREATED', 'ATTEMPTED', 'PAID', 'FAILED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "billing"."RefundStatus" AS ENUM ('PENDING', 'PROCESSED', 'FAILED');

-- CreateEnum
CREATE TYPE "billing"."WebhookEventStatus" AS ENUM ('RECEIVED', 'PROCESSED', 'SKIPPED', 'FAILED');

-- CreateEnum
CREATE TYPE "crm"."LedgerEntryType" AS ENUM ('CHARGE', 'PAYMENT', 'REFUND', 'CONCESSION', 'ADJUSTMENT');

-- AlterEnum
ALTER TYPE "crm"."InvoiceStatus" ADD VALUE 'REFUNDED';

-- AlterEnum
ALTER TYPE "crm"."PaymentStatus" ADD VALUE 'PARTIALLY_REFUNDED';

-- AlterTable
ALTER TABLE "crm"."payments" ADD COLUMN     "gateway_order_id" TEXT,
ADD COLUMN     "refunded_amount" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "billing"."payment_gateway_configs" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "provider" "billing"."GatewayProvider" NOT NULL DEFAULT 'RAZORPAY',
    "environment" "billing"."GatewayEnvironment" NOT NULL DEFAULT 'TEST',
    "status" "billing"."GatewayConfigStatus" NOT NULL DEFAULT 'DRAFT',
    "is_current" BOOLEAN NOT NULL DEFAULT false,
    "key_id_encrypted" TEXT NOT NULL,
    "key_secret_encrypted" TEXT NOT NULL,
    "webhook_secret_encrypted" TEXT NOT NULL,
    "encryption_key_version" INTEGER NOT NULL DEFAULT 1,
    "key_id_last4" TEXT,
    "allow_partial" BOOLEAN NOT NULL DEFAULT true,
    "min_partial_amount" DECIMAL(12,2),
    "verified_at" TIMESTAMP(3),
    "webhook_verified_at" TIMESTAMP(3),
    "last_webhook_at" TIMESTAMP(3),
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "payment_gateway_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing"."gateway_orders" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "provider" "billing"."GatewayProvider" NOT NULL,
    "environment" "billing"."GatewayEnvironment" NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "student_id" TEXT,
    "parent_id" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" "billing"."GatewayOrderStatus" NOT NULL DEFAULT 'CREATED',
    "provider_order_id" TEXT NOT NULL,
    "provider_payment_id" TEXT,
    "failure_code" TEXT,
    "failure_reason" TEXT,
    "payment_id" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gateway_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing"."webhook_events" (
    "id" TEXT NOT NULL,
    "org_id" TEXT,
    "provider" "billing"."GatewayProvider" NOT NULL,
    "provider_event_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "status" "billing"."WebhookEventStatus" NOT NULL DEFAULT 'RECEIVED',
    "signature_valid" BOOLEAN NOT NULL,
    "payload" JSONB NOT NULL,
    "error" TEXT,
    "processed_at" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing"."refunds" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "gateway_order_id" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" "billing"."RefundStatus" NOT NULL DEFAULT 'PENDING',
    "provider_refund_id" TEXT,
    "reason" TEXT,
    "initiated_by_id" TEXT NOT NULL,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm"."ledger_entries" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "invoice_id" TEXT,
    "payment_id" TEXT,
    "refund_id" TEXT,
    "type" "crm"."LedgerEntryType" NOT NULL,
    "debit" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "credit" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "balance" DECIMAL(12,2) NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payment_gateway_configs_org_id_status_idx" ON "billing"."payment_gateway_configs"("org_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "payment_gateway_configs_org_id_provider_environment_key" ON "billing"."payment_gateway_configs"("org_id", "provider", "environment");

-- CreateIndex
CREATE UNIQUE INDEX "gateway_orders_payment_id_key" ON "billing"."gateway_orders"("payment_id");

-- CreateIndex
CREATE INDEX "gateway_orders_org_id_status_idx" ON "billing"."gateway_orders"("org_id", "status");

-- CreateIndex
CREATE INDEX "gateway_orders_org_id_invoice_id_idx" ON "billing"."gateway_orders"("org_id", "invoice_id");

-- CreateIndex
CREATE INDEX "gateway_orders_status_expires_at_idx" ON "billing"."gateway_orders"("status", "expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "gateway_orders_provider_provider_order_id_key" ON "billing"."gateway_orders"("provider", "provider_order_id");

-- CreateIndex
CREATE INDEX "webhook_events_org_id_created_at_idx" ON "billing"."webhook_events"("org_id", "created_at");

-- CreateIndex
CREATE INDEX "webhook_events_status_created_at_idx" ON "billing"."webhook_events"("status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_events_provider_provider_event_id_key" ON "billing"."webhook_events"("provider", "provider_event_id");

-- CreateIndex
CREATE INDEX "refunds_org_id_status_idx" ON "billing"."refunds"("org_id", "status");

-- CreateIndex
CREATE INDEX "refunds_payment_id_idx" ON "billing"."refunds"("payment_id");

-- CreateIndex
CREATE UNIQUE INDEX "refunds_org_id_provider_refund_id_key" ON "billing"."refunds"("org_id", "provider_refund_id");

-- CreateIndex
CREATE INDEX "ledger_entries_org_id_student_id_created_at_idx" ON "crm"."ledger_entries"("org_id", "student_id", "created_at");

-- CreateIndex
CREATE INDEX "ledger_entries_invoice_id_idx" ON "crm"."ledger_entries"("invoice_id");

-- CreateIndex
CREATE INDEX "payments_org_id_gateway_order_id_idx" ON "crm"."payments"("org_id", "gateway_order_id");

-- AddForeignKey
ALTER TABLE "billing"."payment_gateway_configs" ADD CONSTRAINT "payment_gateway_configs_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "platform"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing"."gateway_orders" ADD CONSTRAINT "gateway_orders_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "platform"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing"."gateway_orders" ADD CONSTRAINT "gateway_orders_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "crm"."invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing"."refunds" ADD CONSTRAINT "refunds_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "platform"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing"."refunds" ADD CONSTRAINT "refunds_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "crm"."payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."ledger_entries" ADD CONSTRAINT "ledger_entries_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "platform"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."ledger_entries" ADD CONSTRAINT "ledger_entries_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "crm"."students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

