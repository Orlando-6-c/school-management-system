'use server';

import { revalidatePath } from 'next/cache';
import db from '@/lib/db';
import { getSession } from '@/lib/session';
import { hasPermission } from '@/lib/authz';

export async function promoteStudents(formData: FormData) {
    const session = await getSession();
    if (!session.schoolId || !(await hasPermission('students', 'edit'))) {
        return { message: 'Unauthorized' };
    }

    const fromClassId = formData.get('fromClassId') as string;
    const toClassId = formData.get('toClassId') as string;

    if (!fromClassId || !toClassId) {
        return { message: 'Please select both source and target classes.' };
    }

    if (fromClassId === toClassId) {
        return { message: 'Source and target classes cannot be the same.' };
    }

    try {
        const result = await db.student.updateMany({
            where: {
                schoolId: session.schoolId,
                classId: fromClassId,
                isActive: true
            },
            data: {
                classId: toClassId
            }
        });

        revalidatePath('/school/students');
        revalidatePath('/school/academics/promote');
        revalidatePath('/school');

        return {
            success: true,
            message: `Successfully promoted ${result.count} students.`
        };
    } catch (error: any) {
        console.error('Promotion error:', error);
        if (error.code === 'P2002') {
            return { message: 'A record with this value already exists.' };
        }
        return { success: false, message: 'Failed to promote students. Please try again.' };
    }
}

export async function createClass(prevState: any, formData: FormData) {
    const session = await getSession();
    if (!session.schoolId || !(await hasPermission('classes', 'create'))) return { message: 'Unauthorized' };

    const combinedName = formData.get('name') as string;
    const [name, gradeLevelString] = combinedName.split('|');
    const gradeLevel = parseInt(gradeLevelString);
    const section = formData.get('section') as string;
    const monthlyTuitionFee = Number(formData.get('monthlyTuitionFee'));

    if (!name || isNaN(gradeLevel)) {
        return { message: 'Name and Grade Level are required' };
    }

    try {
        // Intercept dormant/active existing classes safely
        const existingClass = await db.class.findFirst({
            where: {
                schoolId: session.schoolId,
                name: name,
                section: section || null
            }
        });

        if (existingClass) {
            if (existingClass.isActive) {
                return { message: 'A class with this exact name and section already exists explicitly.' };
            } else {
                // Reactivate and refresh dormant class parameters
                await db.class.update({
                    where: { id: existingClass.id },
                    data: {
                        isActive: true,
                        monthlyTuitionFee: monthlyTuitionFee || 0,
                    }
                });
                revalidatePath('/school/classes');
                revalidatePath('/school/academics');
                return { success: true, message: 'Archived class successfully reactivated and restored.' };
            }
        }

        // Standard new creation
        await db.class.create({
            data: {
                schoolId: session.schoolId,
                name,
                gradeLevel,
                section: section || null,
                monthlyTuitionFee: monthlyTuitionFee || 0,
                hexCode: '#' + Math.floor(Math.random() * 16777215).toString(16)
            }
        });

        revalidatePath('/school/classes');
        revalidatePath('/school/academics');
        return { success: true, message: 'Class created successfully' };
    } catch (error: any) {
        console.error('Create Class Error:', error);
        return { success: false, message: 'Failed to create class. Please try again.' };
    }
}

export async function getClasses() {
    const session = await getSession();
    if (!session.schoolId) return [];
    return await db.class.findMany({
        where: { schoolId: session.schoolId, isActive: true },
        orderBy: { gradeLevel: 'asc' }
    });
}

export async function assignTeacherToClass(prevState: any, formData: FormData) {
    const session = await getSession();
    if (!session.schoolId || !(await hasPermission('classes', 'edit'))) return { success: false, message: 'Unauthorized' };

    const teacherId = formData.get('teacherId') as string;
    const classId = formData.get('classId') as string;
    const subject = formData.get('subject') as string;
    const isClassTeacher = formData.get('isClassTeacher') === 'on';

    if (!teacherId || !classId || !subject) return { success: false, message: 'All fields are required' };

    try {
        await db.teacherClassAssignment.create({
            data: { teacherId, classId, subject, isClassTeacher }
        });
        revalidatePath('/school/academics/assignments');
        return { success: true, message: 'Teacher assigned successfully' };
    } catch (error: any) {
        if (error.code === 'P2002') return { success: false, message: 'This teacher is already assigned to this subject for this class.' };
        return { success: false, message: 'Failed to assign teacher.' };
    }
}

export async function removeTeacherAssignment(assignmentId: string) {
    const session = await getSession();
    if (!session.schoolId || !(await hasPermission('classes', 'edit'))) return { success: false, message: 'Unauthorized' };

    try {
        await db.teacherClassAssignment.delete({
            where: { id: assignmentId }
        });
        revalidatePath('/school/academics/assignments');
        return { success: true, message: 'Assignment removed' };
    } catch (error) {
        return { success: false, message: 'Failed to remove assignment' };
    }
}
