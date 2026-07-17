-- CreateEnum
CREATE TYPE "billing"."MessageSpendIntentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REFUNDED');

-- CreateTable
CREATE TABLE "billing"."message_spend_intents" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "channel" "billing"."MessageChannel" NOT NULL,
    "qty" INTEGER NOT NULL,
    "from_free" INTEGER NOT NULL,
    "from_purchased" INTEGER NOT NULL,
    "ref" TEXT,
    "status" "billing"."MessageSpendIntentStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmed_at" TIMESTAMP(3),
    "refunded_at" TIMESTAMP(3),

    CONSTRAINT "message_spend_intents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "message_spend_intents_status_created_at_idx" ON "billing"."message_spend_intents"("status", "created_at");

-- CreateIndex
CREATE INDEX "message_spend_intents_org_id_idx" ON "billing"."message_spend_intents"("org_id");

-- AddForeignKey
ALTER TABLE "billing"."message_spend_intents" ADD CONSTRAINT "message_spend_intents_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "platform"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "crm"."timetable_slots_org_id_grade_label_section_key_day_of_week_key" RENAME TO "timetable_slots_org_id_grade_label_section_key_day_of_week__key";
