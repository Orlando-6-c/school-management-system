-- AlterTable: add subject and isClassTeacher to TeacherClassAssignment
ALTER TABLE "TeacherClassAssignment" ADD COLUMN "subject" TEXT NOT NULL DEFAULT '',
ADD COLUMN "isClassTeacher" BOOLEAN NOT NULL DEFAULT false;

-- DropIndex: remove old unique constraint
DROP INDEX "TeacherClassAssignment_teacherId_classId_key";

-- CreateIndex: new unique constraint includes subject
CREATE UNIQUE INDEX "TeacherClassAssignment_teacherId_classId_subject_key" ON "TeacherClassAssignment"("teacherId", "classId", "subject");
