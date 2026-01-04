'use server';

import { getSession } from '@/lib/session';
import db from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const createClassSchema = z.object({
    name: z.string().min(1, "Class name is required"),
    section: z.string().optional(),
    classTeacherId: z.string().optional(),
    monthlyTuitionFee: z.coerce.number().min(0).default(0), // Updated field
});

// Hex codes for standard classes
function getHexCode(className: string): string {
    const map: Record<string, string> = {
        'Play Group': '00', 'Nursery': '01', 'Prep': '02',
        'Grade 1': '10', 'Grade 2': '20', 'Grade 3': '30', 'Grade 4': '40', 'Grade 5': '50',
        'Grade 6': '60', 'Grade 7': '70', 'Grade 8': '80', 'Grade 9': '90', 'Grade 10': 'A0'
    };
    return map[className] || 'FF';
}

function getGradeLevel(className: string): number {
    const map: Record<string, number> = {
        'Play Group': 0, 'Nursery': 0, 'Prep': 0,
        'Grade 1': 1, 'Grade 2': 2, 'Grade 3': 3, 'Grade 4': 4, 'Grade 5': 5,
        'Grade 6': 6, 'Grade 7': 7, 'Grade 8': 8, 'Grade 9': 9, 'Grade 10': 10
    };
    return map[className] || 99;
}

export async function createClass(prevState: any, formData: FormData) {
    const session = await getSession();
    if (!session.schoolId) return { message: 'Unauthorized' };

    const result = createClassSchema.safeParse(Object.fromEntries(formData));
    if (!result.success) {
        return { message: 'Validation failed', errors: result.error.flatten().fieldErrors };
    }

    const { name, section, classTeacherId, monthlyTuitionFee } = result.data;

    try {
        // 1. Create Class
        const newClass = await db.class.create({
            data: {
                schoolId: session.schoolId,
                name,
                section: section || null,
                gradeLevel: getGradeLevel(name),
                hexCode: getHexCode(name),
                monthlyTuitionFee: monthlyTuitionFee, // Updated field
            }
        });

        // 2. Assign Teacher if selected
        if (classTeacherId) {
            await db.teacherClassAssignment.create({
                data: {
                    teacherId: classTeacherId,
                    classId: newClass.id
                }
            });
        }

        revalidatePath('/school/academics');
        revalidatePath('/school/classes'); // New path
        revalidatePath('/school/students/new');
        return { success: true, message: 'Class created successfully' };
    } catch (error: any) {
        console.error(error);
        if (error.code === 'P2002') {
            return { message: 'Class with this name and section already exists' };
        }
        return { message: 'Failed to create class' };
    }
}

export async function deleteClass(classId: string) {
    const session = await getSession();
    if (!session.schoolId) return { message: 'Unauthorized' };

    try {
        await db.class.delete({
            where: {
                id: classId,
                schoolId: session.schoolId
            }
        });
        revalidatePath('/school/academics');
        revalidatePath('/school/classes');
        return { success: true, message: 'Class deleted' };
    } catch (error) {
        return { message: 'Failed to delete class' };
    }
}
