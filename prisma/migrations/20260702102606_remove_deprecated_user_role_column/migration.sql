/*
  Warnings:

  - You are about to drop the column `role` on the `users` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "platform"."users_role_idx";

-- AlterTable
ALTER TABLE "platform"."users" DROP COLUMN "role";
