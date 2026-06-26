-- AlterTable: add login lockout fields to User
ALTER TABLE "User" ADD COLUMN "loginAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "lockedUntil" TIMESTAMP(3);

-- AlterTable: add login lockout fields to SuperAdmin
ALTER TABLE "SuperAdmin" ADD COLUMN "loginAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "lockedUntil" TIMESTAMP(3);
