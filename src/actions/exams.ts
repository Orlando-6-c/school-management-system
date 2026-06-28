'use server';

import db from '@/lib/db';
import { getSession } from '@/lib/session';
import { hasPermission } from '@/lib/authz';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

export type ExamFormState = { success?: boolean; message?: string; errors?: Record<string, string[]> };

// ── Exams ─────────────────────────────────────────────────────────────────────

const examSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    classId: z.string().min(1, 'Class is required'),
    date: z.string().min(1, 'Date is required'),
});

export async function createExam(prevState: ExamFormState | undefined, formData: FormData): Promise<ExamFormState> {
    const session = await getSession();
    if (!session.schoolId || !(await hasPermission('academics', 'create'))) {
        return { message: 'Access denied' };
    }

    const result = examSchema.safeParse(Object.fromEntries(formData));
    if (!result.success) return { errors: result.error.flatten().fieldErrors };

    const { title, classId, date } = result.data;

    const cls = await db.class.findFirst({ where: { id: classId, schoolId: session.schoolId } });
    if (!cls) return { message: 'Class not found' };

    await db.exam.create({
        data: { title, classId, date: new Date(date), schoolId: session.schoolId },
    });

    revalidatePath('/school/academics/exams');
    return { success: true, message: 'Exam created' };
}

export async function deleteExam(id: string): Promise<ExamFormState> {
    const session = await getSession();
    if (!session.schoolId || !(await hasPermission('academics', 'delete'))) {
        return { message: 'Access denied' };
    }
    const exam = await db.exam.findFirst({ where: { id, schoolId: session.schoolId } });
    if (!exam) return { message: 'Not found' };
    await db.exam.delete({ where: { id } });
    revalidatePath('/school/academics/exams');
    return { success: true };
}

// ── Results ───────────────────────────────────────────────────────────────────

const resultsSchema = z.array(z.object({
    studentId: z.string().min(1),
    subject: z.string().min(1),
    marksObtained: z.coerce.number().min(0),
    totalMarks: z.coerce.number().min(1),
    remarks: z.string().optional(),
}));

export async function saveExamResults(examId: string, rawResults: {
    studentId: string;
    subject: string;
    marksObtained: number;
    totalMarks: number;
    remarks?: string;
}[]): Promise<ExamFormState> {
    const session = await getSession();
    if (!session.schoolId || !(await hasPermission('academics', 'edit'))) {
        return { message: 'Access denied' };
    }

    const exam = await db.exam.findFirst({ where: { id: examId, schoolId: session.schoolId } });
    if (!exam) return { message: 'Exam not found' };

    const parsed = resultsSchema.safeParse(rawResults);
    if (!parsed.success) return { message: 'Invalid result data' };

    // Upsert results
    await db.$transaction(
        parsed.data.map((r) =>
            db.examResult.upsert({
                where: { examId_studentId_subject: { examId, studentId: r.studentId, subject: r.subject } },
                create: { examId, studentId: r.studentId, subject: r.subject, marksObtained: r.marksObtained, totalMarks: r.totalMarks, remarks: r.remarks },
                update: { marksObtained: r.marksObtained, totalMarks: r.totalMarks, remarks: r.remarks },
            }),
        ),
    );

    revalidatePath('/school/academics/exams');
    return { success: true, message: 'Results saved' };
}
