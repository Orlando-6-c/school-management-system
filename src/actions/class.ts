'use server';

import { getSession } from '@/lib/session';
import { hasPermission } from '@/lib/authz';
import db from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';

export type ClassState = {
    success?: boolean;
    message?: string;
};

export async function updateClass(id: string, prevState: ClassState | undefined, formData: FormData): Promise<ClassState> {
    const session = await getSession();
    if (!session.schoolId || !(await hasPermission('classes', 'edit'))) return { message: 'Unauthorized' };

    const nameStr = formData.get('name') as string;
    const section = formData.get('section') as string;
    const monthlyTuitionFee = Number(formData.get('monthlyTuitionFee'));
    const classTeacherId = formData.get('classTeacherId') as string;

    if (!nameStr) return { message: 'Class name is required' };

    // Support both "Grade 1|3" and just "Grade 1" formats
    const parts = nameStr.split('|');
    const name = parts[0];
    const gradeLevel = parts.length > 1 ? parseInt(parts[1], 10) : undefined;

    try {
        await db.$transaction(async (tx) => {
            await tx.class.update({
                where: { id, schoolId: session.schoolId! },
                data: {
                    name,
                    gradeLevel: gradeLevel !== undefined && !isNaN(gradeLevel) ? gradeLevel : undefined,
                    section: section || null,
                    monthlyTuitionFee: new Prisma.Decimal(monthlyTuitionFee || 0),
                }
            });

            // Handle class teacher assignment
            if (classTeacherId) {
                // Remove existing assignments for this class
                await tx.teacherClassAssignment.deleteMany({
                    where: { classId: id }
                });

                // Assign new safely mapping foreign keys
                await tx.teacherClassAssignment.create({
                    data: {
                        classId: id,
                        teacherId: classTeacherId,
                        subject: 'Class Teacher',
                        isClassTeacher: true,
                    }
                });
            } else {
                // Explicitly unassigned
                await tx.teacherClassAssignment.deleteMany({
                    where: { classId: id }
                });
            }
        });

        revalidatePath('/school/academics');
        return { success: true, message: 'Class successfully updated.' };
    } catch (e: any) {
        console.error(e);
        if (e.code === 'P2002') return { message: 'A class with this identical name and section already exists.' };
        return { message: e.message || 'Failed to update class.' };
    }
}

export async function deleteClass(id: string, prevState: ClassState | undefined, formData: FormData): Promise<ClassState> {
    const session = await getSession();
    if (!session.schoolId || !(await hasPermission('classes', 'delete'))) return { message: 'Unauthorized' };

    try {
        await db.class.update({
            where: { id, schoolId: session.schoolId },
            data: { isActive: false }
        });

        revalidatePath('/school/academics');
        return { success: true, message: 'Class securely removed.' };
    } catch (e: any) {
        console.error(e);
        return { message: 'Failed to delete class. Please ensure standard dependencies are unlinked.' };
    }
}
