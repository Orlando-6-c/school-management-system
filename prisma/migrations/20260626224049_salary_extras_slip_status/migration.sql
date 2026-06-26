-- AlterTable
ALTER TABLE "SalarySlip" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'Pending',
ALTER COLUMN "paidAt" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Staff" ADD COLUMN     "salary" DECIMAL(10,2) DEFAULT 0,
ADD COLUMN     "salaryExtras" JSONB NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE "Teacher" ADD COLUMN     "salaryExtras" JSONB NOT NULL DEFAULT '[]';
