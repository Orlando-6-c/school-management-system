'use server';

import { revalidatePath } from 'next/cache';
import db from '@/lib/db';
import { getSession } from '@/lib/session';

export async function promoteStudents(prevState: any, formData: FormData) {
    const session = await getSession();
    if (!session.schoolId) {
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
    } catch (error) {
        console.error('Promotion error:', error);
        return { message: 'Failed to promote students.' };
    }
}

export async function createClass(prevState: any, formData: FormData) {
    const session = await getSession();
    if (!session.schoolId) return { message: 'Unauthorized' };

    const combinedName = formData.get('name') as string;
    const [name, gradeLevelString] = combinedName.split('|');
    const gradeLevel = parseInt(gradeLevelString);
    const section = formData.get('section') as string;
    const monthlyTuitionFee = Number(formData.get('monthlyTuitionFee'));

    if (!name || isNaN(gradeLevel)) {
        return { message: 'Name and Grade Level are required' };
    }

    try {
        await db.class.create({
            data: {
                schoolId: session.schoolId,
                name,
                gradeLevel,
                section,
                monthlyTuitionFee: monthlyTuitionFee || 0,
                // Generate a random hex color for the class
                hexCode: '#' + Math.floor(Math.random() * 16777215).toString(16)
            }
        });

        revalidatePath('/school/academics');
        return { success: true, message: 'Class created successfully' };
    } catch (error) {
        console.error('Create Class Error:', error);
        return { message: 'Failed to create class' };
    }
}
