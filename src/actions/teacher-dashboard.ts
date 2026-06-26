'use server';

import { getSession } from '@/lib/session';
import { hasPermission } from '@/lib/authz';
import db from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function saveAttendance(classId: string, date: string, records: { studentId: string; isPresent: boolean; remarks?: string }[]) {
    const session = await getSession();
    if (!session.schoolId || !(session.role === 'Teacher' || (await hasPermission('attendance', 'create')))) return { success: false, message: 'Unauthorized' };

    try {
        const dateObj = new Date(date);

        // Execute sequentially or via transaction
        await db.$transaction(
            records.map(r =>
                db.attendance.upsert({
                    where: { studentId_date: { studentId: r.studentId, date: dateObj } },
                    update: { isPresent: r.isPresent, remarks: r.remarks },
                    create: {
                        schoolId: session.schoolId!,
                        classId,
                        studentId: r.studentId,
                        date: dateObj,
                        isPresent: r.isPresent,
                        remarks: r.remarks
                    }
                })
            )
        );

        revalidatePath('/school/teacher/attendance');
        return { success: true, message: 'Attendance saved successfully' };
    } catch (e) {
        console.error("Save Attendance Error:", e);
        return { success: false, message: 'Database Error while saving attendance.' };
    }
}

export async function createHomework(prevState: any, formData: FormData) {
    const session = await getSession();
    if (!session.schoolId || !(session.role === 'Teacher' || (await hasPermission('academics', 'create')))) return { success: false, message: 'Unauthorized' };

    const classId = formData.get('classId') as string;
    const subject = formData.get('subject') as string;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const dueDateStr = formData.get('dueDate') as string;

    if (!classId || !subject || !title || !description || !dueDateStr) {
        return { success: false, message: 'All fields are required' };
    }

    try {
        const user = await db.user.findUnique({ where: { username_schoolId: { username: session.userId!, schoolId: session.schoolId } } });
        if (!user || !user.teacherId) return { success: false, message: 'Teacher profile strictly required to post homework.' };

        await db.homework.create({
            data: {
                schoolId: session.schoolId,
                classId,
                teacherId: user.teacherId,
                subject,
                title,
                description,
                dueDate: new Date(dueDateStr)
            }
        });

        revalidatePath('/school/teacher/homework');
        return { success: true, message: 'Homework posted successfully' };
    } catch (e) {
        return { success: false, message: 'Server Error posting homework' };
    }
}

export async function deleteHomework(homeworkId: string) {
    const session = await getSession();
    if (!session.schoolId || !(session.role === 'Teacher' || (await hasPermission('academics', 'delete')))) return { success: false };
    try {
        await db.homework.delete({ where: { id: homeworkId } });
        revalidatePath('/school/teacher/homework');
        return { success: true };
    } catch (e) {
        return { success: false };
    }
}

export async function uploadMaterial(prevState: any, formData: FormData) {
    const session = await getSession();
    if (!session.schoolId || !(session.role === 'Teacher' || (await hasPermission('academics', 'create')))) return { success: false, message: 'Unauthorized' };

    const classId = formData.get('classId') as string;
    const subject = formData.get('subject') as string;
    const title = formData.get('title') as string;
    const fileUrl = formData.get('fileUrl') as string; // Usually a cloud bucket URL mapping

    if (!subject || !title || !fileUrl) {
        return { success: false, message: 'Missing fields' };
    }

    try {
        const user = await db.user.findUnique({ where: { username_schoolId: { username: session.userId!, schoolId: session.schoolId } } });
        if (!user || !user.teacherId) return { success: false, message: 'Teacher profile required.' };

        await db.studyMaterial.create({
            data: {
                schoolId: session.schoolId,
                classId: classId === 'all' ? null : classId,
                teacherId: user.teacherId,
                subject,
                title,
                fileUrl,
                fileType: 'EXT' // Mocked extension mapping based on URL ending logic traditionally
            }
        });

        revalidatePath('/school/teacher/materials');
        return { success: true, message: 'Material uploaded successfully' };
    } catch (e) {
        return { success: false, message: 'Server Error uploading material' };
    }
}

export async function deleteMaterial(materialId: string) {
    const session = await getSession();
    if (!session.schoolId || !(session.role === 'Teacher' || (await hasPermission('academics', 'delete')))) return { success: false };
    try {
        await db.studyMaterial.delete({ where: { id: materialId } });
        revalidatePath('/school/teacher/materials');
        return { success: true };
    } catch (e) {
        return { success: false };
    }
}
