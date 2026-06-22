-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "billing";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "crm";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "marketplace";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "platform";

-- CreateEnum
CREATE TYPE "platform"."InstitutionType" AS ENUM ('SCHOOL', 'LEARNING_CENTER', 'COACHING_CENTER', 'JUNIOR_COLLEGE', 'SKILL_DEVELOPMENT', 'SPORTS_ACADEMY');

-- CreateEnum
CREATE TYPE "platform"."OrgStatus" AS ENUM ('PENDING_VERIFICATION', 'TRIAL', 'ACTIVE', 'PAST_DUE', 'GRACE_PERIOD', 'SUSPENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "platform"."UserRole" AS ENUM ('SUPER_ADMIN', 'OPERATIONS_ADMIN', 'SUPPORT_ADMIN', 'ORG_ADMIN', 'BRANCH_ADMIN', 'COUNSELLOR', 'RECEPTIONIST', 'ACCOUNTANT', 'TEACHER', 'PARENT');

-- CreateEnum
CREATE TYPE "platform"."UserStatus" AS ENUM ('ACTIVE', 'INVITED', 'SUSPENDED', 'DEACTIVATED');

-- CreateEnum
CREATE TYPE "platform"."AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'MODULE_TOGGLE', 'PERMISSION_CHANGE');

-- CreateEnum
CREATE TYPE "platform"."ScrapingStatus" AS ENUM ('PENDING', 'SUCCESS', 'PARTIAL', 'FAILED');

-- CreateEnum
CREATE TYPE "platform"."OtpChannel" AS ENUM ('SMS', 'WHATSAPP', 'EMAIL');

-- CreateEnum
CREATE TYPE "platform"."OtpPurpose" AS ENUM ('SIGNUP', 'LOGIN', 'VERIFY_PHONE', 'VERIFY_EMAIL');

-- CreateEnum
CREATE TYPE "platform"."DomainStatus" AS ENUM ('PENDING', 'VERIFYING', 'ACTIVE', 'FAILED');

-- CreateEnum
CREATE TYPE "crm"."AcademicYearType" AS ENUM ('ACADEMIC', 'FINANCIAL', 'CALENDAR', 'CUSTOM');

-- CreateEnum
CREATE TYPE "crm"."AcademicYearStatus" AS ENUM ('UPCOMING', 'ACTIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "crm"."LeadSource" AS ENUM ('VIDHYAAN', 'WALK_IN', 'PHONE', 'EMAIL', 'WHATSAPP', 'WEBSITE', 'REFERRAL', 'SOCIAL_MEDIA', 'GOOGLE_ADS', 'META_ADS', 'JUSTDIAL', 'CAMPAIGN', 'EVENT', 'NEWSPAPER', 'HOARDING', 'IMPORT', 'OTHER');

-- CreateEnum
CREATE TYPE "crm"."LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'FOLLOW_UP', 'VISIT_SCHEDULED', 'VISITED', 'APPLICATION_STARTED', 'NURTURING', 'CONVERTED', 'LOST', 'JUNK');

-- CreateEnum
CREATE TYPE "crm"."LeadPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "crm"."ActivityType" AS ENUM ('NOTE', 'CALL', 'EMAIL', 'SMS', 'WHATSAPP', 'MEETING', 'STATUS_CHANGE', 'STAGE_CHANGE', 'ASSIGNMENT', 'DOCUMENT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "crm"."AdmissionStatus" AS ENUM ('IN_PROGRESS', 'ADMITTED', 'REJECTED', 'WAITLISTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "crm"."DocumentReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'FLAGGED');

-- CreateEnum
CREATE TYPE "crm"."StudentStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ALUMNI', 'TRANSFERRED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "crm"."Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "crm"."CustomFieldType" AS ENUM ('TEXT', 'TEXTAREA', 'NUMBER', 'CURRENCY', 'DATE', 'TIME', 'DATETIME', 'DROPDOWN', 'MULTI_SELECT', 'RADIO', 'CHECKBOX', 'BOOLEAN', 'PHONE', 'EMAIL', 'URL', 'FILE');

-- CreateEnum
CREATE TYPE "crm"."FeeFrequency" AS ENUM ('ONE_TIME', 'MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'ANNUAL', 'CUSTOM');

-- CreateEnum
CREATE TYPE "crm"."InvoiceStatus" AS ENUM ('UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'WAIVED');

-- CreateEnum
CREATE TYPE "crm"."PaymentMethod" AS ENUM ('RAZORPAY', 'CASH', 'CHEQUE', 'DD', 'NEFT', 'BANK_TRANSFER', 'UPI', 'CARD', 'OTHER');

-- CreateEnum
CREATE TYPE "crm"."PaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "crm"."ConcessionType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');

-- CreateEnum
CREATE TYPE "crm"."CampaignChannel" AS ENUM ('EMAIL', 'SMS', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "crm"."CampaignStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'PAUSED', 'FAILED');

-- CreateEnum
CREATE TYPE "crm"."RecipientStatus" AS ENUM ('QUEUED', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'OPTED_OUT');

-- CreateEnum
CREATE TYPE "crm"."NotificationChannel" AS ENUM ('IN_APP', 'EMAIL', 'SMS', 'WHATSAPP', 'PUSH');

-- CreateEnum
CREATE TYPE "crm"."CommunicationDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum
CREATE TYPE "crm"."QueueStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "marketplace"."EnquiryStatus" AS ENUM ('NEW', 'RESPONDED', 'CONVERTED', 'CLOSED');

-- CreateEnum
CREATE TYPE "marketplace"."ApplicationStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'SHORTLISTED', 'ADMITTED', 'REJECTED', 'WAITLISTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "marketplace"."ReviewStatus" AS ENUM ('PUBLISHED', 'FLAGGED', 'REMOVED');

-- CreateEnum
CREATE TYPE "marketplace"."WaitlistStatus" AS ENUM ('WAITING', 'OFFERED', 'ACCEPTED', 'EXPIRED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "marketplace"."RsvpStatus" AS ENUM ('GOING', 'MAYBE', 'NOT_GOING', 'ATTENDED');

-- CreateEnum
CREATE TYPE "marketplace"."VerificationStatus" AS ENUM ('UNCLAIMED', 'PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "marketplace"."DataSource" AS ENUM ('SCRAPED', 'CLAIMED', 'MANUAL', 'IMPORTED');

-- CreateEnum
CREATE TYPE "billing"."BillingCycle" AS ENUM ('MONTHLY', 'QUARTERLY', 'ANNUAL');

-- CreateEnum
CREATE TYPE "billing"."SubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'GRACE_PERIOD', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "billing"."TransactionType" AS ENUM ('SUBSCRIPTION', 'RENEWAL', 'UPGRADE', 'REFUND', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "billing"."TransactionStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "billing"."ReferralStatus" AS ENUM ('PENDING', 'QUALIFIED', 'REWARDED', 'EXPIRED');

-- CreateTable
CREATE TABLE "platform"."organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "institution_type" "platform"."InstitutionType" NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "gst_number" TEXT,
    "status" "platform"."OrgStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "trial_ends_at" TIMESTAMP(3),
    "lead_cap" INTEGER NOT NULL DEFAULT 10,
    "plan_id" TEXT,
    "settings" JSONB,
    "onboarded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform"."branches" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "code" TEXT,
    "address_line" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform"."users" (
    "id" TEXT NOT NULL,
    "org_id" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "name" TEXT NOT NULL,
    "role" "platform"."UserRole" NOT NULL,
    "status" "platform"."UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "pin_hash" TEXT,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform"."user_branch_access" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "role" "platform"."UserRole" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_branch_access_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform"."modules" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform"."organization_modules" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "module_id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "config" JSONB,
    "enabled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform"."audit_logs" (
    "id" TEXT NOT NULL,
    "org_id" TEXT,
    "user_id" TEXT,
    "action" "platform"."AuditAction" NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "before" JSONB,
    "after" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform"."scraping_logs" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "target_url" TEXT,
    "school_id" TEXT,
    "status" "platform"."ScrapingStatus" NOT NULL DEFAULT 'PENDING',
    "records_in" INTEGER NOT NULL DEFAULT 0,
    "records_out" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scraping_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform"."api_keys" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "ip_whitelist" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "last_used_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform"."otp_codes" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "channel" "platform"."OtpChannel" NOT NULL,
    "purpose" "platform"."OtpPurpose" NOT NULL,
    "code_hash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "consumed_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3) NOT NULL,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform"."org_domains" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "status" "platform"."DomainStatus" NOT NULL DEFAULT 'PENDING',
    "dns_records" JSONB,
    "verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "org_domains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace"."schools" (
    "id" TEXT NOT NULL,
    "org_id" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "institution_type" "platform"."InstitutionType" NOT NULL,
    "description" TEXT,
    "verification_status" "marketplace"."VerificationStatus" NOT NULL DEFAULT 'UNCLAIMED',
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "profile_completion" INTEGER NOT NULL DEFAULT 0,
    "ranking_score" INTEGER NOT NULL DEFAULT 0,
    "avg_rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "review_count" INTEGER NOT NULL DEFAULT 0,
    "response_rate_pct" INTEGER,
    "avg_response_hours" INTEGER,
    "admission_open" BOOLEAN NOT NULL DEFAULT false,
    "google_place_id" TEXT,
    "data_source" "marketplace"."DataSource" NOT NULL DEFAULT 'SCRAPED',
    "quality_score" INTEGER NOT NULL DEFAULT 0,
    "claimed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "schools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace"."school_locations" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "org_id" TEXT,
    "label" TEXT,
    "address_line" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "school_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace"."school_contacts" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "org_id" TEXT,
    "type" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "school_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace"."school_media" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "org_id" TEXT,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "school_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace"."school_facilities" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "org_id" TEXT,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "school_facilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace"."school_fee_ranges" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "org_id" TEXT,
    "grade_label" TEXT NOT NULL,
    "min_amount" DECIMAL(12,2) NOT NULL,
    "max_amount" DECIMAL(12,2) NOT NULL,
    "frequency" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "school_fee_ranges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace"."school_affiliation" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "org_id" TEXT,
    "board" TEXT NOT NULL,
    "affiliation_no" TEXT,
    "valid_till" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "school_affiliation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace"."school_accreditation" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "org_id" TEXT,
    "name" TEXT NOT NULL,
    "issued_by" TEXT,
    "issued_at" TIMESTAMP(3),
    "valid_till" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "school_accreditation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace"."school_hours" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "org_id" TEXT,
    "day_of_week" INTEGER NOT NULL,
    "open_time" TEXT,
    "close_time" TEXT,
    "is_closed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "school_hours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace"."parents" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "city" TEXT,
    "pin_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "parents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace"."kids_profiles" (
    "id" TEXT NOT NULL,
    "parent_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date_of_birth" TIMESTAMP(3),
    "gender" "crm"."Gender",
    "grade_sought" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "kids_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace"."parent_enquiries" (
    "id" TEXT NOT NULL,
    "org_id" TEXT,
    "school_id" TEXT NOT NULL,
    "parent_id" TEXT NOT NULL,
    "kid_name" TEXT,
    "grade_sought" TEXT,
    "message" TEXT,
    "status" "marketplace"."EnquiryStatus" NOT NULL DEFAULT 'NEW',
    "lead_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "parent_enquiries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace"."parent_applications" (
    "id" TEXT NOT NULL,
    "org_id" TEXT,
    "school_id" TEXT NOT NULL,
    "parent_id" TEXT NOT NULL,
    "kid_name" TEXT NOT NULL,
    "grade_sought" TEXT,
    "status" "marketplace"."ApplicationStatus" NOT NULL DEFAULT 'SUBMITTED',
    "admission_id" TEXT,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "parent_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace"."parent_bookmarks" (
    "id" TEXT NOT NULL,
    "parent_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parent_bookmarks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace"."school_views" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "org_id" TEXT,
    "parent_id" TEXT,
    "source" TEXT,
    "ip_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "school_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace"."school_reviews" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "org_id" TEXT,
    "parent_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "rating_academics" INTEGER,
    "rating_faculty" INTEGER,
    "rating_infrastructure" INTEGER,
    "rating_safety" INTEGER,
    "rating_activities" INTEGER,
    "rating_value" INTEGER,
    "title" TEXT,
    "body" TEXT,
    "status" "marketplace"."ReviewStatus" NOT NULL DEFAULT 'PUBLISHED',
    "flag_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "school_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace"."review_responses" (
    "id" TEXT NOT NULL,
    "review_id" TEXT NOT NULL,
    "org_id" TEXT,
    "author_type" TEXT NOT NULL,
    "author_id" TEXT,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "review_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace"."waitlist_entries" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "parent_id" TEXT NOT NULL,
    "grade_label" TEXT NOT NULL,
    "position" INTEGER,
    "status" "marketplace"."WaitlistStatus" NOT NULL DEFAULT 'WAITING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "waitlist_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace"."open_day_events" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3),
    "venue" TEXT,
    "capacity" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "open_day_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace"."open_day_rsvp" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "parent_id" TEXT NOT NULL,
    "status" "marketplace"."RsvpStatus" NOT NULL DEFAULT 'GOING',
    "guests" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "open_day_rsvp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm"."academic_years" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "crm"."AcademicYearType" NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "status" "crm"."AcademicYearStatus" NOT NULL DEFAULT 'UPCOMING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academic_years_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm"."leads" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "branch_id" TEXT,
    "academic_year_id" TEXT,
    "lead_code" TEXT NOT NULL,
    "parent_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "kid_name" TEXT,
    "grade_sought" TEXT,
    "source" "crm"."LeadSource" NOT NULL DEFAULT 'OTHER',
    "status" "crm"."LeadStatus" NOT NULL DEFAULT 'NEW',
    "priority" "crm"."LeadPriority" NOT NULL DEFAULT 'MEDIUM',
    "assigned_to_id" TEXT,
    "enquiry_id" TEXT,
    "lost_reason" TEXT,
    "first_contacted_at" TIMESTAMP(3),
    "next_follow_up_at" TIMESTAMP(3),
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm"."lead_activities" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "branch_id" TEXT,
    "academic_year_id" TEXT,
    "lead_id" TEXT NOT NULL,
    "type" "crm"."ActivityType" NOT NULL,
    "summary" TEXT NOT NULL,
    "metadata" JSONB,
    "performed_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm"."lead_custom_fields" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "type" "crm"."CustomFieldType" NOT NULL,
    "options" JSONB,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_custom_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm"."admissions" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "branch_id" TEXT,
    "academic_year_id" TEXT,
    "admission_code" TEXT NOT NULL,
    "lead_id" TEXT,
    "stage_id" TEXT,
    "status" "crm"."AdmissionStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "applicant_name" TEXT NOT NULL,
    "grade_sought" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "assigned_to_id" TEXT,
    "rejection_reason" TEXT,
    "decided_at" TIMESTAMP(3),
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "admissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm"."admission_stages" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "is_won" BOOLEAN NOT NULL DEFAULT false,
    "is_lost" BOOLEAN NOT NULL DEFAULT false,
    "requires_docs" BOOLEAN NOT NULL DEFAULT false,
    "requires_payment" BOOLEAN NOT NULL DEFAULT false,
    "color" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "admission_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm"."admission_activities" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "branch_id" TEXT,
    "academic_year_id" TEXT,
    "admission_id" TEXT NOT NULL,
    "type" "crm"."ActivityType" NOT NULL,
    "summary" TEXT NOT NULL,
    "metadata" JSONB,
    "performed_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admission_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm"."admission_documents" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "admission_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "size_bytes" INTEGER,
    "scan_status" "crm"."DocumentReviewStatus" NOT NULL DEFAULT 'PENDING',
    "is_aadhaar" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMP(3),
    "uploaded_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "admission_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm"."admission_capacity" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "branch_id" TEXT,
    "academic_year_id" TEXT NOT NULL,
    "grade_label" TEXT NOT NULL,
    "total_seats" INTEGER NOT NULL,
    "filled_seats" INTEGER NOT NULL DEFAULT 0,
    "auto_close" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admission_capacity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm"."students" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "branch_id" TEXT,
    "academic_year_id" TEXT,
    "student_code" TEXT NOT NULL,
    "roll_number" TEXT,
    "admission_id" TEXT,
    "batch_id" TEXT,
    "name" TEXT NOT NULL,
    "gender" "crm"."Gender",
    "date_of_birth" TIMESTAMP(3),
    "grade_label" TEXT,
    "guardian_name" TEXT,
    "guardian_phone" TEXT,
    "guardian_email" TEXT,
    "status" "crm"."StudentStatus" NOT NULL DEFAULT 'ACTIVE',
    "alumni_since" TIMESTAMP(3),
    "portal_access_revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm"."student_custom_fields" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "type" "crm"."CustomFieldType" NOT NULL,
    "options" JSONB,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_custom_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm"."student_batches" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "branch_id" TEXT,
    "academic_year_id" TEXT,
    "name" TEXT NOT NULL,
    "programme" TEXT,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "capacity" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "student_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm"."sibling_links" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "sibling_id" TEXT NOT NULL,
    "relation" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sibling_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm"."fee_plan_templates" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "structure" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "fee_plan_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm"."fee_plans" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "branch_id" TEXT,
    "academic_year_id" TEXT,
    "template_id" TEXT,
    "name" TEXT NOT NULL,
    "grade_label" TEXT,
    "total_amount" DECIMAL(12,2) NOT NULL,
    "frequency" "crm"."FeeFrequency" NOT NULL DEFAULT 'ANNUAL',
    "structure" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "fee_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm"."invoices" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "branch_id" TEXT,
    "academic_year_id" TEXT,
    "invoice_number" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "total_amount" DECIMAL(12,2) NOT NULL,
    "paid_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "late_fee_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" "crm"."InvoiceStatus" NOT NULL DEFAULT 'UNPAID',
    "due_date" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm"."invoice_items" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "head" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm"."payments" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "branch_id" TEXT,
    "academic_year_id" TEXT,
    "receipt_number" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "student_id" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "method" "crm"."PaymentMethod" NOT NULL DEFAULT 'RAZORPAY',
    "status" "crm"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "gateway_ref" TEXT,
    "instrument_no" TEXT,
    "instrument_date" TIMESTAMP(3),
    "bank_name" TEXT,
    "bank_branch" TEXT,
    "utr_number" TEXT,
    "cleared_at" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm"."concessions" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "student_id" TEXT,
    "invoice_id" TEXT,
    "type" "crm"."ConcessionType" NOT NULL,
    "value" DECIMAL(12,2) NOT NULL,
    "reason" TEXT,
    "approved_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "concessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm"."events" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "branch_id" TEXT,
    "academic_year_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3),
    "location" TEXT,
    "meeting_link" TEXT,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm"."event_rsvp" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "attendee_type" TEXT NOT NULL,
    "attendee_id" TEXT,
    "status" "marketplace"."RsvpStatus" NOT NULL DEFAULT 'GOING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_rsvp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm"."campaigns" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "branch_id" TEXT,
    "academic_year_id" TEXT,
    "name" TEXT NOT NULL,
    "channel" "crm"."CampaignChannel" NOT NULL,
    "status" "crm"."CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "template_body" TEXT,
    "scheduled_at" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    "audience_filter" JSONB,
    "stats" JSONB,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm"."campaign_recipients" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "recipient_type" TEXT NOT NULL,
    "recipient_id" TEXT,
    "contact" TEXT NOT NULL,
    "status" "crm"."RecipientStatus" NOT NULL DEFAULT 'QUEUED',
    "provider_ref" TEXT,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_recipients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm"."notifications" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "recipient_type" TEXT NOT NULL,
    "recipient_id" TEXT,
    "channel" "crm"."NotificationChannel" NOT NULL DEFAULT 'IN_APP',
    "title" TEXT NOT NULL,
    "body" TEXT,
    "data" JSONB,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm"."notification_preferences" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "email" BOOLEAN NOT NULL DEFAULT true,
    "sms" BOOLEAN NOT NULL DEFAULT false,
    "whatsapp" BOOLEAN NOT NULL DEFAULT false,
    "in_app" BOOLEAN NOT NULL DEFAULT true,
    "push" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm"."counsellor_targets" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "branch_id" TEXT,
    "academic_year_id" TEXT,
    "user_id" TEXT NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "lead_target" INTEGER NOT NULL DEFAULT 0,
    "conversion_target" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "counsellor_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm"."communication_logs" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "user_id" TEXT,
    "channel" "crm"."NotificationChannel" NOT NULL,
    "direction" "crm"."CommunicationDirection" NOT NULL,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "contact" TEXT NOT NULL,
    "content" TEXT,
    "provider_ref" TEXT,
    "status" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "communication_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm"."notification_queue" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "channel" "crm"."NotificationChannel" NOT NULL,
    "recipient_type" TEXT NOT NULL,
    "recipient_id" TEXT,
    "contact" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "crm"."QueueStatus" NOT NULL DEFAULT 'PENDING',
    "scheduled_for" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing"."plans" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "monthly_price" DECIMAL(12,2) NOT NULL,
    "lead_cap" INTEGER,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing"."plan_modules" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "module_slug" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plan_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing"."subscriptions" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "status" "billing"."SubscriptionStatus" NOT NULL DEFAULT 'TRIALING',
    "billing_cycle" "billing"."BillingCycle" NOT NULL DEFAULT 'ANNUAL',
    "amount" DECIMAL(12,2) NOT NULL,
    "discount_pct" INTEGER NOT NULL DEFAULT 0,
    "trial_ends_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3),
    "current_period_end" TIMESTAMP(3),
    "grace_ends_at" TIMESTAMP(3),
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "gateway_sub_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing"."subscription_items" (
    "id" TEXT NOT NULL,
    "subscription_id" TEXT NOT NULL,
    "module_slug" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing"."transactions" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "subscription_id" TEXT,
    "type" "billing"."TransactionType" NOT NULL,
    "status" "billing"."TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DECIMAL(12,2) NOT NULL,
    "gst_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "gateway_ref" TEXT,
    "invoice_url" TEXT,
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing"."referrals" (
    "id" TEXT NOT NULL,
    "referrer_org_id" TEXT NOT NULL,
    "referee_org_id" TEXT,
    "code" TEXT NOT NULL,
    "status" "billing"."ReferralStatus" NOT NULL DEFAULT 'PENDING',
    "reward_amount" DECIMAL(12,2),
    "rewarded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referrals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "platform"."organizations"("slug");

-- CreateIndex
CREATE INDEX "organizations_status_idx" ON "platform"."organizations"("status");

-- CreateIndex
CREATE INDEX "organizations_institution_type_idx" ON "platform"."organizations"("institution_type");

-- CreateIndex
CREATE INDEX "organizations_plan_id_idx" ON "platform"."organizations"("plan_id");

-- CreateIndex
CREATE INDEX "branches_org_id_idx" ON "platform"."branches"("org_id");

-- CreateIndex
CREATE INDEX "users_org_id_idx" ON "platform"."users"("org_id");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "platform"."users"("role");

-- CreateIndex
CREATE INDEX "users_phone_idx" ON "platform"."users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_org_id_email_key" ON "platform"."users"("org_id", "email");

-- CreateIndex
CREATE INDEX "user_branch_access_branch_id_idx" ON "platform"."user_branch_access"("branch_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_branch_access_user_id_branch_id_key" ON "platform"."user_branch_access"("user_id", "branch_id");

-- CreateIndex
CREATE UNIQUE INDEX "modules_slug_key" ON "platform"."modules"("slug");

-- CreateIndex
CREATE INDEX "organization_modules_org_id_idx" ON "platform"."organization_modules"("org_id");

-- CreateIndex
CREATE UNIQUE INDEX "organization_modules_org_id_module_id_key" ON "platform"."organization_modules"("org_id", "module_id");

-- CreateIndex
CREATE INDEX "audit_logs_org_id_idx" ON "platform"."audit_logs"("org_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "platform"."audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "platform"."audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "platform"."audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "scraping_logs_status_idx" ON "platform"."scraping_logs"("status");

-- CreateIndex
CREATE INDEX "scraping_logs_school_id_idx" ON "platform"."scraping_logs"("school_id");

-- CreateIndex
CREATE INDEX "scraping_logs_created_at_idx" ON "platform"."scraping_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_hash_key" ON "platform"."api_keys"("hash");

-- CreateIndex
CREATE INDEX "api_keys_org_id_idx" ON "platform"."api_keys"("org_id");

-- CreateIndex
CREATE INDEX "api_keys_hash_idx" ON "platform"."api_keys"("hash");

-- CreateIndex
CREATE INDEX "otp_codes_identifier_idx" ON "platform"."otp_codes"("identifier");

-- CreateIndex
CREATE INDEX "otp_codes_expires_at_idx" ON "platform"."otp_codes"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "org_domains_domain_key" ON "platform"."org_domains"("domain");

-- CreateIndex
CREATE INDEX "org_domains_org_id_idx" ON "platform"."org_domains"("org_id");

-- CreateIndex
CREATE UNIQUE INDEX "schools_slug_key" ON "marketplace"."schools"("slug");

-- CreateIndex
CREATE INDEX "schools_org_id_idx" ON "marketplace"."schools"("org_id");

-- CreateIndex
CREATE INDEX "schools_institution_type_idx" ON "marketplace"."schools"("institution_type");

-- CreateIndex
CREATE INDEX "schools_is_verified_idx" ON "marketplace"."schools"("is_verified");

-- CreateIndex
CREATE INDEX "schools_ranking_score_idx" ON "marketplace"."schools"("ranking_score");

-- CreateIndex
CREATE INDEX "school_locations_school_id_idx" ON "marketplace"."school_locations"("school_id");

-- CreateIndex
CREATE INDEX "school_locations_city_idx" ON "marketplace"."school_locations"("city");

-- CreateIndex
CREATE INDEX "school_locations_pincode_idx" ON "marketplace"."school_locations"("pincode");

-- CreateIndex
CREATE INDEX "school_contacts_school_id_idx" ON "marketplace"."school_contacts"("school_id");

-- CreateIndex
CREATE INDEX "school_media_school_id_idx" ON "marketplace"."school_media"("school_id");

-- CreateIndex
CREATE INDEX "school_facilities_school_id_idx" ON "marketplace"."school_facilities"("school_id");

-- CreateIndex
CREATE INDEX "school_fee_ranges_school_id_idx" ON "marketplace"."school_fee_ranges"("school_id");

-- CreateIndex
CREATE INDEX "school_affiliation_school_id_idx" ON "marketplace"."school_affiliation"("school_id");

-- CreateIndex
CREATE INDEX "school_accreditation_school_id_idx" ON "marketplace"."school_accreditation"("school_id");

-- CreateIndex
CREATE INDEX "school_hours_school_id_idx" ON "marketplace"."school_hours"("school_id");

-- CreateIndex
CREATE UNIQUE INDEX "school_hours_school_id_day_of_week_key" ON "marketplace"."school_hours"("school_id", "day_of_week");

-- CreateIndex
CREATE UNIQUE INDEX "parents_phone_key" ON "marketplace"."parents"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "parents_email_key" ON "marketplace"."parents"("email");

-- CreateIndex
CREATE INDEX "parents_phone_idx" ON "marketplace"."parents"("phone");

-- CreateIndex
CREATE INDEX "kids_profiles_parent_id_idx" ON "marketplace"."kids_profiles"("parent_id");

-- CreateIndex
CREATE INDEX "parent_enquiries_org_id_idx" ON "marketplace"."parent_enquiries"("org_id");

-- CreateIndex
CREATE INDEX "parent_enquiries_school_id_idx" ON "marketplace"."parent_enquiries"("school_id");

-- CreateIndex
CREATE INDEX "parent_enquiries_parent_id_idx" ON "marketplace"."parent_enquiries"("parent_id");

-- CreateIndex
CREATE INDEX "parent_enquiries_status_idx" ON "marketplace"."parent_enquiries"("status");

-- CreateIndex
CREATE INDEX "parent_applications_org_id_idx" ON "marketplace"."parent_applications"("org_id");

-- CreateIndex
CREATE INDEX "parent_applications_school_id_idx" ON "marketplace"."parent_applications"("school_id");

-- CreateIndex
CREATE INDEX "parent_applications_parent_id_idx" ON "marketplace"."parent_applications"("parent_id");

-- CreateIndex
CREATE INDEX "parent_applications_status_idx" ON "marketplace"."parent_applications"("status");

-- CreateIndex
CREATE INDEX "parent_bookmarks_school_id_idx" ON "marketplace"."parent_bookmarks"("school_id");

-- CreateIndex
CREATE UNIQUE INDEX "parent_bookmarks_parent_id_school_id_key" ON "marketplace"."parent_bookmarks"("parent_id", "school_id");

-- CreateIndex
CREATE INDEX "school_views_school_id_idx" ON "marketplace"."school_views"("school_id");

-- CreateIndex
CREATE INDEX "school_views_created_at_idx" ON "marketplace"."school_views"("created_at");

-- CreateIndex
CREATE INDEX "school_reviews_school_id_idx" ON "marketplace"."school_reviews"("school_id");

-- CreateIndex
CREATE INDEX "school_reviews_parent_id_idx" ON "marketplace"."school_reviews"("parent_id");

-- CreateIndex
CREATE INDEX "school_reviews_status_idx" ON "marketplace"."school_reviews"("status");

-- CreateIndex
CREATE INDEX "review_responses_review_id_idx" ON "marketplace"."review_responses"("review_id");

-- CreateIndex
CREATE INDEX "waitlist_entries_org_id_idx" ON "marketplace"."waitlist_entries"("org_id");

-- CreateIndex
CREATE INDEX "waitlist_entries_school_id_idx" ON "marketplace"."waitlist_entries"("school_id");

-- CreateIndex
CREATE INDEX "waitlist_entries_status_idx" ON "marketplace"."waitlist_entries"("status");

-- CreateIndex
CREATE INDEX "open_day_events_org_id_idx" ON "marketplace"."open_day_events"("org_id");

-- CreateIndex
CREATE INDEX "open_day_events_school_id_idx" ON "marketplace"."open_day_events"("school_id");

-- CreateIndex
CREATE INDEX "open_day_events_starts_at_idx" ON "marketplace"."open_day_events"("starts_at");

-- CreateIndex
CREATE INDEX "open_day_rsvp_parent_id_idx" ON "marketplace"."open_day_rsvp"("parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "open_day_rsvp_event_id_parent_id_key" ON "marketplace"."open_day_rsvp"("event_id", "parent_id");

-- CreateIndex
CREATE INDEX "academic_years_org_id_idx" ON "crm"."academic_years"("org_id");

-- CreateIndex
CREATE INDEX "academic_years_status_idx" ON "crm"."academic_years"("status");

-- CreateIndex
CREATE UNIQUE INDEX "academic_years_org_id_name_key" ON "crm"."academic_years"("org_id", "name");

-- CreateIndex
CREATE INDEX "leads_org_id_idx" ON "crm"."leads"("org_id");

-- CreateIndex
CREATE INDEX "leads_branch_id_idx" ON "crm"."leads"("branch_id");

-- CreateIndex
CREATE INDEX "leads_academic_year_id_idx" ON "crm"."leads"("academic_year_id");

-- CreateIndex
CREATE INDEX "leads_status_idx" ON "crm"."leads"("status");

-- CreateIndex
CREATE INDEX "leads_assigned_to_id_idx" ON "crm"."leads"("assigned_to_id");

-- CreateIndex
CREATE INDEX "leads_phone_idx" ON "crm"."leads"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "leads_org_id_lead_code_key" ON "crm"."leads"("org_id", "lead_code");

-- CreateIndex
CREATE INDEX "lead_activities_org_id_idx" ON "crm"."lead_activities"("org_id");

-- CreateIndex
CREATE INDEX "lead_activities_lead_id_idx" ON "crm"."lead_activities"("lead_id");

-- CreateIndex
CREATE INDEX "lead_activities_type_idx" ON "crm"."lead_activities"("type");

-- CreateIndex
CREATE INDEX "lead_custom_fields_org_id_idx" ON "crm"."lead_custom_fields"("org_id");

-- CreateIndex
CREATE UNIQUE INDEX "lead_custom_fields_org_id_key_key" ON "crm"."lead_custom_fields"("org_id", "key");

-- CreateIndex
CREATE INDEX "admissions_org_id_idx" ON "crm"."admissions"("org_id");

-- CreateIndex
CREATE INDEX "admissions_branch_id_idx" ON "crm"."admissions"("branch_id");

-- CreateIndex
CREATE INDEX "admissions_academic_year_id_idx" ON "crm"."admissions"("academic_year_id");

-- CreateIndex
CREATE INDEX "admissions_status_idx" ON "crm"."admissions"("status");

-- CreateIndex
CREATE INDEX "admissions_stage_id_idx" ON "crm"."admissions"("stage_id");

-- CreateIndex
CREATE INDEX "admissions_assigned_to_id_idx" ON "crm"."admissions"("assigned_to_id");

-- CreateIndex
CREATE UNIQUE INDEX "admissions_org_id_admission_code_key" ON "crm"."admissions"("org_id", "admission_code");

-- CreateIndex
CREATE INDEX "admission_stages_org_id_idx" ON "crm"."admission_stages"("org_id");

-- CreateIndex
CREATE UNIQUE INDEX "admission_stages_org_id_sort_order_key" ON "crm"."admission_stages"("org_id", "sort_order");

-- CreateIndex
CREATE INDEX "admission_activities_org_id_idx" ON "crm"."admission_activities"("org_id");

-- CreateIndex
CREATE INDEX "admission_activities_admission_id_idx" ON "crm"."admission_activities"("admission_id");

-- CreateIndex
CREATE INDEX "admission_documents_org_id_idx" ON "crm"."admission_documents"("org_id");

-- CreateIndex
CREATE INDEX "admission_documents_admission_id_idx" ON "crm"."admission_documents"("admission_id");

-- CreateIndex
CREATE INDEX "admission_documents_scan_status_idx" ON "crm"."admission_documents"("scan_status");

-- CreateIndex
CREATE INDEX "admission_capacity_org_id_idx" ON "crm"."admission_capacity"("org_id");

-- CreateIndex
CREATE INDEX "admission_capacity_academic_year_id_idx" ON "crm"."admission_capacity"("academic_year_id");

-- CreateIndex
CREATE UNIQUE INDEX "admission_capacity_org_id_academic_year_id_branch_id_grade__key" ON "crm"."admission_capacity"("org_id", "academic_year_id", "branch_id", "grade_label");

-- CreateIndex
CREATE UNIQUE INDEX "students_admission_id_key" ON "crm"."students"("admission_id");

-- CreateIndex
CREATE INDEX "students_org_id_idx" ON "crm"."students"("org_id");

-- CreateIndex
CREATE INDEX "students_branch_id_idx" ON "crm"."students"("branch_id");

-- CreateIndex
CREATE INDEX "students_academic_year_id_idx" ON "crm"."students"("academic_year_id");

-- CreateIndex
CREATE INDEX "students_status_idx" ON "crm"."students"("status");

-- CreateIndex
CREATE INDEX "students_batch_id_idx" ON "crm"."students"("batch_id");

-- CreateIndex
CREATE UNIQUE INDEX "students_org_id_student_code_key" ON "crm"."students"("org_id", "student_code");

-- CreateIndex
CREATE INDEX "student_custom_fields_org_id_idx" ON "crm"."student_custom_fields"("org_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_custom_fields_org_id_key_key" ON "crm"."student_custom_fields"("org_id", "key");

-- CreateIndex
CREATE INDEX "student_batches_org_id_idx" ON "crm"."student_batches"("org_id");

-- CreateIndex
CREATE INDEX "student_batches_branch_id_idx" ON "crm"."student_batches"("branch_id");

-- CreateIndex
CREATE INDEX "sibling_links_org_id_idx" ON "crm"."sibling_links"("org_id");

-- CreateIndex
CREATE INDEX "sibling_links_sibling_id_idx" ON "crm"."sibling_links"("sibling_id");

-- CreateIndex
CREATE UNIQUE INDEX "sibling_links_student_id_sibling_id_key" ON "crm"."sibling_links"("student_id", "sibling_id");

-- CreateIndex
CREATE INDEX "fee_plan_templates_org_id_idx" ON "crm"."fee_plan_templates"("org_id");

-- CreateIndex
CREATE INDEX "fee_plans_org_id_idx" ON "crm"."fee_plans"("org_id");

-- CreateIndex
CREATE INDEX "fee_plans_academic_year_id_idx" ON "crm"."fee_plans"("academic_year_id");

-- CreateIndex
CREATE INDEX "invoices_org_id_idx" ON "crm"."invoices"("org_id");

-- CreateIndex
CREATE INDEX "invoices_student_id_idx" ON "crm"."invoices"("student_id");

-- CreateIndex
CREATE INDEX "invoices_status_idx" ON "crm"."invoices"("status");

-- CreateIndex
CREATE INDEX "invoices_due_date_idx" ON "crm"."invoices"("due_date");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_org_id_invoice_number_key" ON "crm"."invoices"("org_id", "invoice_number");

-- CreateIndex
CREATE INDEX "invoice_items_org_id_idx" ON "crm"."invoice_items"("org_id");

-- CreateIndex
CREATE INDEX "invoice_items_invoice_id_idx" ON "crm"."invoice_items"("invoice_id");

-- CreateIndex
CREATE INDEX "payments_org_id_idx" ON "crm"."payments"("org_id");

-- CreateIndex
CREATE INDEX "payments_invoice_id_idx" ON "crm"."payments"("invoice_id");

-- CreateIndex
CREATE INDEX "payments_student_id_idx" ON "crm"."payments"("student_id");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "crm"."payments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "payments_org_id_receipt_number_key" ON "crm"."payments"("org_id", "receipt_number");

-- CreateIndex
CREATE INDEX "concessions_org_id_idx" ON "crm"."concessions"("org_id");

-- CreateIndex
CREATE INDEX "concessions_student_id_idx" ON "crm"."concessions"("student_id");

-- CreateIndex
CREATE INDEX "concessions_invoice_id_idx" ON "crm"."concessions"("invoice_id");

-- CreateIndex
CREATE INDEX "events_org_id_idx" ON "crm"."events"("org_id");

-- CreateIndex
CREATE INDEX "events_starts_at_idx" ON "crm"."events"("starts_at");

-- CreateIndex
CREATE INDEX "event_rsvp_org_id_idx" ON "crm"."event_rsvp"("org_id");

-- CreateIndex
CREATE INDEX "event_rsvp_event_id_idx" ON "crm"."event_rsvp"("event_id");

-- CreateIndex
CREATE INDEX "campaigns_org_id_idx" ON "crm"."campaigns"("org_id");

-- CreateIndex
CREATE INDEX "campaigns_status_idx" ON "crm"."campaigns"("status");

-- CreateIndex
CREATE INDEX "campaign_recipients_org_id_idx" ON "crm"."campaign_recipients"("org_id");

-- CreateIndex
CREATE INDEX "campaign_recipients_campaign_id_idx" ON "crm"."campaign_recipients"("campaign_id");

-- CreateIndex
CREATE INDEX "campaign_recipients_status_idx" ON "crm"."campaign_recipients"("status");

-- CreateIndex
CREATE INDEX "notifications_org_id_idx" ON "crm"."notifications"("org_id");

-- CreateIndex
CREATE INDEX "notifications_recipient_type_recipient_id_idx" ON "crm"."notifications"("recipient_type", "recipient_id");

-- CreateIndex
CREATE INDEX "notifications_read_at_idx" ON "crm"."notifications"("read_at");

-- CreateIndex
CREATE INDEX "notification_preferences_org_id_idx" ON "crm"."notification_preferences"("org_id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_user_id_category_key" ON "crm"."notification_preferences"("user_id", "category");

-- CreateIndex
CREATE INDEX "counsellor_targets_org_id_idx" ON "crm"."counsellor_targets"("org_id");

-- CreateIndex
CREATE INDEX "counsellor_targets_user_id_idx" ON "crm"."counsellor_targets"("user_id");

-- CreateIndex
CREATE INDEX "communication_logs_org_id_idx" ON "crm"."communication_logs"("org_id");

-- CreateIndex
CREATE INDEX "communication_logs_user_id_idx" ON "crm"."communication_logs"("user_id");

-- CreateIndex
CREATE INDEX "communication_logs_entity_type_entity_id_idx" ON "crm"."communication_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "communication_logs_created_at_idx" ON "crm"."communication_logs"("created_at");

-- CreateIndex
CREATE INDEX "notification_queue_org_id_idx" ON "crm"."notification_queue"("org_id");

-- CreateIndex
CREATE INDEX "notification_queue_status_scheduled_for_idx" ON "crm"."notification_queue"("status", "scheduled_for");

-- CreateIndex
CREATE UNIQUE INDEX "plans_slug_key" ON "billing"."plans"("slug");

-- CreateIndex
CREATE INDEX "plan_modules_plan_id_idx" ON "billing"."plan_modules"("plan_id");

-- CreateIndex
CREATE UNIQUE INDEX "plan_modules_plan_id_module_slug_key" ON "billing"."plan_modules"("plan_id", "module_slug");

-- CreateIndex
CREATE INDEX "subscriptions_org_id_idx" ON "billing"."subscriptions"("org_id");

-- CreateIndex
CREATE INDEX "subscriptions_status_idx" ON "billing"."subscriptions"("status");

-- CreateIndex
CREATE INDEX "subscription_items_subscription_id_idx" ON "billing"."subscription_items"("subscription_id");

-- CreateIndex
CREATE INDEX "transactions_org_id_idx" ON "billing"."transactions"("org_id");

-- CreateIndex
CREATE INDEX "transactions_subscription_id_idx" ON "billing"."transactions"("subscription_id");

-- CreateIndex
CREATE INDEX "transactions_status_idx" ON "billing"."transactions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "referrals_code_key" ON "billing"."referrals"("code");

-- CreateIndex
CREATE INDEX "referrals_referrer_org_id_idx" ON "billing"."referrals"("referrer_org_id");

-- CreateIndex
CREATE INDEX "referrals_status_idx" ON "billing"."referrals"("status");

-- AddForeignKey
ALTER TABLE "platform"."organizations" ADD CONSTRAINT "organizations_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "billing"."plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform"."branches" ADD CONSTRAINT "branches_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "platform"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform"."users" ADD CONSTRAINT "users_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "platform"."organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform"."user_branch_access" ADD CONSTRAINT "user_branch_access_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "platform"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform"."user_branch_access" ADD CONSTRAINT "user_branch_access_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "platform"."branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform"."organization_modules" ADD CONSTRAINT "organization_modules_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "platform"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform"."organization_modules" ADD CONSTRAINT "organization_modules_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "platform"."modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform"."audit_logs" ADD CONSTRAINT "audit_logs_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "platform"."organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform"."api_keys" ADD CONSTRAINT "api_keys_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "platform"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform"."org_domains" ADD CONSTRAINT "org_domains_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "platform"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace"."schools" ADD CONSTRAINT "schools_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "platform"."organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace"."school_locations" ADD CONSTRAINT "school_locations_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "marketplace"."schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace"."school_contacts" ADD CONSTRAINT "school_contacts_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "marketplace"."schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace"."school_media" ADD CONSTRAINT "school_media_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "marketplace"."schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace"."school_facilities" ADD CONSTRAINT "school_facilities_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "marketplace"."schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace"."school_fee_ranges" ADD CONSTRAINT "school_fee_ranges_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "marketplace"."schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace"."school_affiliation" ADD CONSTRAINT "school_affiliation_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "marketplace"."schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace"."school_accreditation" ADD CONSTRAINT "school_accreditation_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "marketplace"."schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace"."school_hours" ADD CONSTRAINT "school_hours_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "marketplace"."schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace"."kids_profiles" ADD CONSTRAINT "kids_profiles_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "marketplace"."parents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace"."parent_enquiries" ADD CONSTRAINT "parent_enquiries_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "platform"."organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace"."parent_enquiries" ADD CONSTRAINT "parent_enquiries_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "marketplace"."schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace"."parent_enquiries" ADD CONSTRAINT "parent_enquiries_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "marketplace"."parents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace"."parent_applications" ADD CONSTRAINT "parent_applications_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "platform"."organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace"."parent_applications" ADD CONSTRAINT "parent_applications_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "marketplace"."schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace"."parent_applications" ADD CONSTRAINT "parent_applications_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "marketplace"."parents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace"."parent_bookmarks" ADD CONSTRAINT "parent_bookmarks_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "marketplace"."parents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace"."parent_bookmarks" ADD CONSTRAINT "parent_bookmarks_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "marketplace"."schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace"."school_views" ADD CONSTRAINT "school_views_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "marketplace"."schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace"."school_reviews" ADD CONSTRAINT "school_reviews_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "marketplace"."schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace"."school_reviews" ADD CONSTRAINT "school_reviews_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "platform"."organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace"."school_reviews" ADD CONSTRAINT "school_reviews_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "marketplace"."parents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace"."review_responses" ADD CONSTRAINT "review_responses_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "marketplace"."school_reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace"."review_responses" ADD CONSTRAINT "review_responses_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "platform"."organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace"."waitlist_entries" ADD CONSTRAINT "waitlist_entries_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "platform"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace"."waitlist_entries" ADD CONSTRAINT "waitlist_entries_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "marketplace"."schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace"."waitlist_entries" ADD CONSTRAINT "waitlist_entries_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "marketplace"."parents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace"."open_day_events" ADD CONSTRAINT "open_day_events_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "platform"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace"."open_day_events" ADD CONSTRAINT "open_day_events_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "marketplace"."schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace"."open_day_rsvp" ADD CONSTRAINT "open_day_rsvp_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "marketplace"."open_day_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace"."open_day_rsvp" ADD CONSTRAINT "open_day_rsvp_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "marketplace"."parents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."academic_years" ADD CONSTRAINT "academic_years_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "platform"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."leads" ADD CONSTRAINT "leads_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "platform"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."leads" ADD CONSTRAINT "leads_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "platform"."branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."leads" ADD CONSTRAINT "leads_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "crm"."academic_years"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."leads" ADD CONSTRAINT "leads_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "platform"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."lead_activities" ADD CONSTRAINT "lead_activities_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "crm"."leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."admissions" ADD CONSTRAINT "admissions_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "platform"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."admissions" ADD CONSTRAINT "admissions_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "platform"."branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."admissions" ADD CONSTRAINT "admissions_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "crm"."academic_years"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."admissions" ADD CONSTRAINT "admissions_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "crm"."leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."admissions" ADD CONSTRAINT "admissions_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "crm"."admission_stages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."admissions" ADD CONSTRAINT "admissions_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "platform"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."admission_stages" ADD CONSTRAINT "admission_stages_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "platform"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."admission_activities" ADD CONSTRAINT "admission_activities_admission_id_fkey" FOREIGN KEY ("admission_id") REFERENCES "crm"."admissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."admission_documents" ADD CONSTRAINT "admission_documents_admission_id_fkey" FOREIGN KEY ("admission_id") REFERENCES "crm"."admissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."admission_capacity" ADD CONSTRAINT "admission_capacity_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "platform"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."admission_capacity" ADD CONSTRAINT "admission_capacity_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "platform"."branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."admission_capacity" ADD CONSTRAINT "admission_capacity_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "crm"."academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."students" ADD CONSTRAINT "students_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "platform"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."students" ADD CONSTRAINT "students_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "platform"."branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."students" ADD CONSTRAINT "students_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "crm"."academic_years"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."students" ADD CONSTRAINT "students_admission_id_fkey" FOREIGN KEY ("admission_id") REFERENCES "crm"."admissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."students" ADD CONSTRAINT "students_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "crm"."student_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."student_batches" ADD CONSTRAINT "student_batches_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "platform"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."student_batches" ADD CONSTRAINT "student_batches_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "platform"."branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."student_batches" ADD CONSTRAINT "student_batches_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "crm"."academic_years"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."sibling_links" ADD CONSTRAINT "sibling_links_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "platform"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."sibling_links" ADD CONSTRAINT "sibling_links_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "crm"."students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."sibling_links" ADD CONSTRAINT "sibling_links_sibling_id_fkey" FOREIGN KEY ("sibling_id") REFERENCES "crm"."students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."fee_plan_templates" ADD CONSTRAINT "fee_plan_templates_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "platform"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."fee_plans" ADD CONSTRAINT "fee_plans_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "platform"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."fee_plans" ADD CONSTRAINT "fee_plans_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "platform"."branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."fee_plans" ADD CONSTRAINT "fee_plans_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "crm"."academic_years"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."fee_plans" ADD CONSTRAINT "fee_plans_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "crm"."fee_plan_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."invoices" ADD CONSTRAINT "invoices_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "platform"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."invoices" ADD CONSTRAINT "invoices_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "platform"."branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."invoices" ADD CONSTRAINT "invoices_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "crm"."academic_years"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."invoices" ADD CONSTRAINT "invoices_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "crm"."students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "crm"."invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."payments" ADD CONSTRAINT "payments_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "platform"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."payments" ADD CONSTRAINT "payments_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "platform"."branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."payments" ADD CONSTRAINT "payments_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "crm"."academic_years"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."payments" ADD CONSTRAINT "payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "crm"."invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."payments" ADD CONSTRAINT "payments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "crm"."students"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."concessions" ADD CONSTRAINT "concessions_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "platform"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."concessions" ADD CONSTRAINT "concessions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "crm"."students"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."concessions" ADD CONSTRAINT "concessions_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "crm"."invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."events" ADD CONSTRAINT "events_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "platform"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."events" ADD CONSTRAINT "events_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "platform"."branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."events" ADD CONSTRAINT "events_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "crm"."academic_years"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."event_rsvp" ADD CONSTRAINT "event_rsvp_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "crm"."events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."campaigns" ADD CONSTRAINT "campaigns_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "platform"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."campaigns" ADD CONSTRAINT "campaigns_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "platform"."branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."campaigns" ADD CONSTRAINT "campaigns_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "crm"."academic_years"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."campaign_recipients" ADD CONSTRAINT "campaign_recipients_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "crm"."campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."notifications" ADD CONSTRAINT "notifications_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "platform"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."notification_preferences" ADD CONSTRAINT "notification_preferences_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "platform"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "platform"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."counsellor_targets" ADD CONSTRAINT "counsellor_targets_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "platform"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."counsellor_targets" ADD CONSTRAINT "counsellor_targets_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "platform"."branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."counsellor_targets" ADD CONSTRAINT "counsellor_targets_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "crm"."academic_years"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."counsellor_targets" ADD CONSTRAINT "counsellor_targets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "platform"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."communication_logs" ADD CONSTRAINT "communication_logs_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "platform"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."communication_logs" ADD CONSTRAINT "communication_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "platform"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm"."notification_queue" ADD CONSTRAINT "notification_queue_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "platform"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing"."plan_modules" ADD CONSTRAINT "plan_modules_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "billing"."plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing"."subscriptions" ADD CONSTRAINT "subscriptions_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "platform"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing"."subscriptions" ADD CONSTRAINT "subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "billing"."plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing"."subscription_items" ADD CONSTRAINT "subscription_items_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "billing"."subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing"."transactions" ADD CONSTRAINT "transactions_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "platform"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing"."transactions" ADD CONSTRAINT "transactions_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "billing"."subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
