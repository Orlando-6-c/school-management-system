/*
  Warnings:

  - You are about to drop the column `classId` on the `AdditionalCharge` table. All the data in the column will be lost.
  - You are about to drop the column `studentId` on the `AdditionalCharge` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "AdditionalCharge" DROP CONSTRAINT "AdditionalCharge_classId_fkey";

-- DropForeignKey
ALTER TABLE "AdditionalCharge" DROP CONSTRAINT "AdditionalCharge_studentId_fkey";

-- DropIndex
DROP INDEX "AdditionalCharge_classId_idx";

-- DropIndex
DROP INDEX "AdditionalCharge_studentId_idx";

-- AlterTable
ALTER TABLE "AdditionalCharge" DROP COLUMN "classId",
DROP COLUMN "studentId",
ADD COLUMN     "classIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "studentIds" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "TeacherClassAssignment" ALTER COLUMN "subject" DROP DEFAULT;
