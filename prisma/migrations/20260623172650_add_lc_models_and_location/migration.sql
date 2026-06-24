-- AlterTable
ALTER TABLE "marketplace"."schools" ADD COLUMN     "activity_types" TEXT[],
ADD COLUMN     "age_group_max" INTEGER,
ADD COLUMN     "age_group_min" INTEGER,
ADD COLUMN     "batch_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "enrolled_student_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "enrollment_status" TEXT NOT NULL DEFAULT 'OPEN',
ADD COLUMN     "home_visit_available" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "monthly_fee_max" INTEGER,
ADD COLUMN     "monthly_fee_min" INTEGER,
ADD COLUMN     "trial_class_available" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "platform"."location_cache" (
    "id" TEXT NOT NULL,
    "lat_rounded" TEXT NOT NULL,
    "lng_rounded" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT,
    "country" TEXT NOT NULL DEFAULT 'India',
    "pincode" TEXT,
    "full_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "location_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace"."instructors" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "qualification" TEXT,
    "specialization" TEXT,
    "experience_years" INTEGER,
    "photo_url" TEXT,
    "bio" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "instructors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace"."batch_schedules" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "activity_name" TEXT NOT NULL,
    "batch_name" TEXT,
    "days_of_week" TEXT[],
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "age_group_min" INTEGER,
    "age_group_max" INTEGER,
    "monthly_fee" INTEGER NOT NULL DEFAULT 0,
    "yearly_fee" INTEGER,
    "registration_fee" INTEGER NOT NULL DEFAULT 0,
    "capacity" INTEGER NOT NULL DEFAULT 20,
    "enrolled_count" INTEGER NOT NULL DEFAULT 0,
    "gender" TEXT NOT NULL DEFAULT 'ALL',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_full" BOOLEAN NOT NULL DEFAULT false,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "batch_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace"."trial_class_bookings" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "batch_schedule_id" TEXT,
    "parent_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "child_name" TEXT NOT NULL,
    "child_age" INTEGER,
    "preferred_date" TIMESTAMP(3),
    "activity_type" TEXT,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "confirmed_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "notes" TEXT,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trial_class_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "location_cache_city_idx" ON "platform"."location_cache"("city");

-- CreateIndex
CREATE UNIQUE INDEX "location_cache_lat_rounded_lng_rounded_key" ON "platform"."location_cache"("lat_rounded", "lng_rounded");

-- CreateIndex
CREATE INDEX "instructors_school_id_idx" ON "marketplace"."instructors"("school_id");

-- CreateIndex
CREATE INDEX "instructors_org_id_idx" ON "marketplace"."instructors"("org_id");

-- CreateIndex
CREATE INDEX "batch_schedules_school_id_idx" ON "marketplace"."batch_schedules"("school_id");

-- CreateIndex
CREATE INDEX "batch_schedules_org_id_idx" ON "marketplace"."batch_schedules"("org_id");

-- CreateIndex
CREATE INDEX "trial_class_bookings_school_id_idx" ON "marketplace"."trial_class_bookings"("school_id");

-- CreateIndex
CREATE INDEX "trial_class_bookings_org_id_idx" ON "marketplace"."trial_class_bookings"("org_id");

-- CreateIndex
CREATE INDEX "trial_class_bookings_status_idx" ON "marketplace"."trial_class_bookings"("status");

-- CreateIndex
CREATE INDEX "trial_class_bookings_created_at_idx" ON "marketplace"."trial_class_bookings"("created_at");

-- AddForeignKey
ALTER TABLE "marketplace"."instructors" ADD CONSTRAINT "instructors_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "marketplace"."schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace"."batch_schedules" ADD CONSTRAINT "batch_schedules_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "marketplace"."schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace"."trial_class_bookings" ADD CONSTRAINT "trial_class_bookings_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "marketplace"."schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace"."trial_class_bookings" ADD CONSTRAINT "trial_class_bookings_batch_schedule_id_fkey" FOREIGN KEY ("batch_schedule_id") REFERENCES "marketplace"."batch_schedules"("id") ON DELETE SET NULL ON UPDATE CASCADE;
