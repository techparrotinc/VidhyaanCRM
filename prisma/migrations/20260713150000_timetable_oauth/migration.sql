-- CreateTable
CREATE TABLE "crm"."timetable_slots" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "branch_id" TEXT,
    "academic_year_id" TEXT,
    "grade_label" TEXT NOT NULL,
    "section" TEXT,
    "section_key" TEXT NOT NULL DEFAULT 'ALL',
    "day_of_week" INTEGER NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "teacher_id" TEXT,
    "room" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "timetable_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform"."user_oauth_accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "email" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_oauth_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "timetable_slots_org_id_grade_label_section_key_idx" ON "crm"."timetable_slots"("org_id", "grade_label", "section_key");

-- CreateIndex
CREATE INDEX "timetable_slots_org_id_teacher_id_idx" ON "crm"."timetable_slots"("org_id", "teacher_id");

-- CreateIndex
CREATE UNIQUE INDEX "timetable_slots_org_id_grade_label_section_key_day_of_week_key" ON "crm"."timetable_slots"("org_id", "grade_label", "section_key", "day_of_week", "start_time");

-- CreateIndex
CREATE UNIQUE INDEX "user_oauth_accounts_provider_provider_account_id_key" ON "platform"."user_oauth_accounts"("provider", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_oauth_accounts_user_id_provider_key" ON "platform"."user_oauth_accounts"("user_id", "provider");

-- AddForeignKey
ALTER TABLE "crm"."timetable_slots" ADD CONSTRAINT "timetable_slots_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "platform"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."timetable_slots" ADD CONSTRAINT "timetable_slots_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "platform"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform"."user_oauth_accounts" ADD CONSTRAINT "user_oauth_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "platform"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
