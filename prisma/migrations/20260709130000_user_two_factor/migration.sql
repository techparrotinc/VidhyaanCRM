-- CreateEnum
CREATE TYPE "platform"."TwoFactorMethod" AS ENUM ('TOTP', 'SMS');

-- AlterEnum
ALTER TYPE "platform"."OtpPurpose" ADD VALUE 'MFA';

-- CreateTable
CREATE TABLE "platform"."user_two_factor" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "method" "platform"."TwoFactorMethod" NOT NULL DEFAULT 'TOTP',
    "secret_enc" TEXT,
    "enabled_at" TIMESTAMP(3),
    "backupCodes" JSONB NOT NULL DEFAULT '[]',
    "last_used_step" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_two_factor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_two_factor_user_id_key" ON "platform"."user_two_factor"("user_id");

-- AddForeignKey
ALTER TABLE "platform"."user_two_factor" ADD CONSTRAINT "user_two_factor_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "platform"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
