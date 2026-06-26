-- Make superAdminId optional on School (supports self-registered schools)
ALTER TABLE "School" ALTER COLUMN "superAdminId" DROP NOT NULL;

-- Drop old CASCADE constraint and re-add with SET NULL
ALTER TABLE "School" DROP CONSTRAINT IF EXISTS "School_superAdminId_fkey";
ALTER TABLE "School" ADD CONSTRAINT "School_superAdminId_fkey"
    FOREIGN KEY ("superAdminId") REFERENCES "SuperAdmin"("id") ON DELETE SET NULL ON UPDATE CASCADE;
