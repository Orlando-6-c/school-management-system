'use server';

import { getSession } from '@/lib/session';
import { hasPermission } from '@/lib/authz';
import db from '@/lib/db';
import { revalidatePath } from 'next/cache';

// Existing old function for backwards compatibility or single edits if needed, though mostly deprecated by Bulk
export async function saveTimetableSlot(prevState: any, formData: FormData) {
    const session = await getSession();
    if (!session.schoolId || !(await hasPermission('academics', 'create'))) return { success: false, message: 'Unauthorized' };

    const classId = formData.get('classId') as string;
    const teacherId = formData.get('teacherId') as string;
    const subject = formData.get('subject') as string;
    const dayOfWeek = parseInt(formData.get('dayOfWeek') as string);
    const startTime = formData.get('startTime') as string;
    const endTime = formData.get('endTime') as string;

    if (!classId || !teacherId || !subject || isNaN(dayOfWeek) || !startTime || !endTime) {
        return { success: false, message: 'Missing fields' };
    }

    try {
        await db.timetable.create({
            data: {
                schoolId: session.schoolId,
                classId,
                teacherId: teacherId,
                subject: subject,
                dayOfWeek,
                startTime,
                endTime
            }
        });

        revalidatePath('/school/academics/timetable');
        return { success: true, message: 'Timetable slot saved' };
    } catch (error: any) {
        console.error('Save Timetable Error:', error);
        if (error.code === 'P2002') return { success: false, message: 'A class cannot have two competing subjects at the same exact time.' };
        return { success: false, message: 'Database Error' };
    }
}

export async function deleteTimetableSlot(slotId: string) {
    const session = await getSession();
    if (!session.schoolId || !(await hasPermission('academics', 'delete'))) return { success: false, message: 'Unauthorized' };

    try {
        await db.timetable.delete({ where: { id: slotId } });
        revalidatePath('/school/academics/timetable');
        return { success: true, message: 'Slot removed' };
    } catch (error) {
        return { success: false, message: 'Failed to delete slot' };
    }
}

export async function saveBulkTimetable(classId: string, payload: any[]) {
    const session = await getSession();
    if (!session.schoolId || !(await hasPermission('academics', 'edit'))) return { success: false, message: 'Unauthorized' };

    const schoolId = session.schoolId!;
    try {
        // Atomic wipe and replace for the entire specific class timetable
        await db.$transaction(async (tx) => {
            await tx.timetable.deleteMany({
                where: { schoolId, classId: classId }
            });

            if (payload.length > 0) {
                // Bulk insert
                await tx.timetable.createMany({
                    data: payload.map(slot => ({
                        schoolId,
                        classId: classId,
                        teacherId: slot.teacherId,
                        subject: slot.subject,
                        dayOfWeek: slot.dayOfWeek,
                        startTime: slot.startTime,
                        endTime: slot.endTime
                    }))
                });
            }
        });

        revalidatePath('/school/academics/timetable');
        return { success: true, message: 'Timetable completely overridden and saved securely!' };
    } catch (error: any) {
        console.error('Bulk Save Timetable Error:', error);
        return { success: false, message: 'Failed to map all timetable blocks recursively. Database constraint Error.' };
    }
}
