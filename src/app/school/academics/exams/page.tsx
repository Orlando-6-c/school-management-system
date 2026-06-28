import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { hasPermission } from '@/lib/authz';
import db from '@/lib/db';
import { ExamsClient } from './exams-client';

export const runtime = 'nodejs';

export default async function ExamsPage({
    searchParams,
}: {
    searchParams: Promise<{ classId?: string; examId?: string }>;
}) {
    const session = await getSession();
    if (!session.schoolId) redirect('/login');
    if (!(await hasPermission('academics', 'view'))) redirect('/school');

    const { classId: selectedClassId, examId: selectedExamId } = await searchParams;

    const [classes, exams] = await Promise.all([
        db.class.findMany({
            where: { schoolId: session.schoolId, isActive: true },
            orderBy: { gradeLevel: 'asc' },
            select: { id: true, name: true, section: true },
        }),
        db.exam.findMany({
            where: {
                schoolId: session.schoolId,
                ...(selectedClassId ? { classId: selectedClassId } : {}),
            },
            include: { class: { select: { name: true, section: true } }, _count: { select: { results: true } } },
            orderBy: { date: 'desc' },
        }),
    ]);

    // If an exam is selected, load its students + existing results
    let examDetail: {
        exam: { id: string; title: string; date: string; class: { name: string; section: string | null } };
        students: { id: string; name: string; rollNumber: string }[];
        results: { studentId: string; subject: string; marksObtained: number; totalMarks: number; remarks: string | null }[];
    } | null = null;

    if (selectedExamId) {
        const exam = await db.exam.findFirst({
            where: { id: selectedExamId, schoolId: session.schoolId },
            include: { class: { select: { name: true, section: true } } },
        });
        if (exam) {
            const [students, results] = await Promise.all([
                db.student.findMany({
                    where: { classId: exam.classId, schoolId: session.schoolId, isActive: true },
                    orderBy: { rollNumber: 'asc' },
                    select: { id: true, name: true, rollNumber: true },
                }),
                db.examResult.findMany({
                    where: { examId: selectedExamId },
                    select: { studentId: true, subject: true, marksObtained: true, totalMarks: true, remarks: true },
                }),
            ]);
            examDetail = {
                exam: { id: exam.id, title: exam.title, date: exam.date.toISOString(), class: exam.class },
                students: students.map((s) => ({ id: s.id, name: s.name, rollNumber: s.rollNumber })),
                results: results.map((r) => ({
                    studentId: r.studentId,
                    subject: r.subject,
                    marksObtained: Number(r.marksObtained),
                    totalMarks: Number(r.totalMarks),
                    remarks: r.remarks,
                })),
            };
        }
    }

    const canManage = await hasPermission('academics', 'create');

    return (
        <ExamsClient
            classes={classes}
            exams={exams.map((e) => ({
                id: e.id,
                title: e.title,
                date: e.date.toISOString(),
                classId: e.classId,
                className: e.class.name,
                classSection: e.class.section,
                resultCount: e._count.results,
            }))}
            examDetail={examDetail}
            selectedClassId={selectedClassId ?? ''}
            canManage={canManage}
        />
    );
}
