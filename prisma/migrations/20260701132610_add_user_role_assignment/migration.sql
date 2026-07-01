/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "platform"."AssignmentStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'REVOKED');

-- AlterTable
ALTER TABLE "platform"."users" ALTER COLUMN "email" DROP NOT NULL;

-- CreateTable
CREATE TABLE "platform"."user_role_assignments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "platform"."UserRole" NOT NULL,
    "org_id" TEXT,
    "status" "platform"."AssignmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "last_used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_role_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_role_assignments_user_id_idx" ON "platform"."user_role_assignments"("user_id");

-- CreateIndex
CREATE INDEX "user_role_assignments_org_id_idx" ON "platform"."user_role_assignments"("org_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_role_assignments_user_id_role_org_id_key" ON "platform"."user_role_assignments"("user_id", "role", "org_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "platform"."users"("email");

-- AddForeignKey
ALTER TABLE "platform"."user_role_assignments" ADD CONSTRAINT "user_role_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "platform"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform"."user_role_assignments" ADD CONSTRAINT "user_role_assignments_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "platform"."organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
