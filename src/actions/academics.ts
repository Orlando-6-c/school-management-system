'use server';

import { getSession } from '@/lib/session';
import db from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const createClassSchema = z.object({
    name: z.string().min(1, "Class name is required"),
    section: z.string().optional(),
    classTeacherId: z.string().optional(), // Optional designated teacher
    annualFee: z.coerce.number().min(0).default(0), // Defaulting for now as user focused on name/teacher
    // The schema required annualFee (Decimal). I'll add it to the form or default it. 
    // User didn't explicitly ask for Fee in this specific "Create Class" prompt, but the DB requires it (or I check schema).
    // Schema: annualFee Decimal @db.Decimal(10, 2). It is NOT optional in schema.
    // So I must include it or set a sensible default. I'll include it in the schema but maybe hide it or default it if UI doesn't have it.
    // User only mentioned "creation form for classes would have a optional field of setting a Designated Class Teacher".
    // I will add a default fee of 0 if not provided, or better, add the field to the form to be safe.
});

// Hex codes for standard classes
function getHexCode(className: string): string {
    // simple mapping or hash
    const map: Record<string, string> = {
        'Play Group': '00', 'Nursery': '01', 'Prep': '02',
        'Grade 1': '10', 'Grade 2': '20', 'Grade 3': '30', 'Grade 4': '40', 'Grade 5': '50',
        'Grade 6': '60', 'Grade 7': '70', 'Grade 8': '80', 'Grade 9': '90', 'Grade 10': 'A0'
    };
    return map[className] || 'FF'; // Default to FF if unknown
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

    const { name, section, classTeacherId, annualFee } = result.data;

    try {
        await db.$transaction(async (tx) => {
            // 1. Create Class
            const newClass = await tx.class.create({
                data: {
                    schoolId: session.schoolId,
                    name,
                    section: section || null,
                    gradeLevel: getGradeLevel(name),
                    hexCode: getHexCode(name),
                    annualFee: annualFee,
                }
            });

            // 2. Assign Teacher if selected
            if (classTeacherId) {
                await tx.teacherClassAssignment.create({
                    data: {
                        teacherId: classTeacherId,
                        classId: newClass.id
                    }
                });
            }
        });

        revalidatePath('/school/academics');
        revalidatePath('/school/students/new'); // Update admission dropdown
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
        return { success: true, message: 'Class deleted' };
    } catch (error) {
        return { message: 'Failed to delete class' };
    }
}
