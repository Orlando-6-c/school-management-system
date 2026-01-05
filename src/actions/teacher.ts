'use server';

import { getSession } from '@/lib/session';
import db from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const teacherSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().min(10, "Valid phone number is required"),
    gender: z.enum(['Male', 'Female']),
    cnic: z.string().min(13, "CNIC must be at least 13 characters"),
    qualification: z.string().min(1, "Qualification is required"),
    subject: z.string().min(1, "Subject is required"),
    experience: z.string().optional(),
    joiningDate: z.coerce.date(), // Auto-convert string to Date
    salary: z.coerce.number().min(0, "Salary cannot be negative"), // Auto-convert string to number
    address: z.string().optional(),
    photograph: z.string().optional(),
});

export type TeacherState = {
    success?: boolean;
    message?: string;
    errors?: Record<string, string[]>;
    teacherId?: string;
};

export async function addTeacher(prevState: TeacherState | undefined, formData: FormData): Promise<TeacherState> {
    const session = await getSession();
    if (!session.schoolId) return { message: 'Unauthorized' };

    const rawData = Object.fromEntries(formData.entries());

    // Filter out empty optional fields to avoid validation errors if they are sent as empty strings
    if (rawData.email === '') delete rawData.email;
    if (rawData.experience === '') delete rawData.experience;
    if (rawData.address === '') delete rawData.address;
    if (rawData.photograph === '') delete rawData.photograph;

    const result = teacherSchema.safeParse(rawData);

    if (!result.success) {
        console.error("Validation Error:", result.error.flatten());
        return {
            errors: result.error.flatten().fieldErrors,
            message: 'Validation failed. Check your inputs.'
        };
    }

    const data = result.data;

    try {
        const teacher = await db.teacher.create({
            data: {
                schoolId: session.schoolId,
                ...data,
                // Ensure explicit nulls for optional fields if they are missing in data object (though Zod handles this mostly)
                email: data.email || null,
                address: data.address || null,
                experience: data.experience || null,
                photograph: data.photograph || null,
            }
        });

        revalidatePath('/school/teachers');
        return { success: true, message: 'Teacher added successfully', teacherId: teacher.id };
    } catch (error: any) {
        console.error('Add Teacher Error:', error);
        return { message: 'Failed to add teacher' };
    }
}

export async function updateTeacher(id: string, prevState: TeacherState | undefined, formData: FormData): Promise<TeacherState> {
    const session = await getSession();
    if (!session.schoolId) return { message: 'Unauthorized' };

    const rawData = Object.fromEntries(formData.entries());

    // Filter out empty optional fields
    if (rawData.email === '') delete rawData.email;
    if (rawData.experience === '') delete rawData.experience;
    if (rawData.address === '') delete rawData.address;
    if (rawData.photograph === '') delete rawData.photograph;

    const result = teacherSchema.safeParse(rawData);

    if (!result.success) {
        return {
            errors: result.error.flatten().fieldErrors,
            message: 'Validation failed. Check your inputs.'
        };
    }

    const data = result.data;

    try {
        await db.teacher.update({
            where: { id, schoolId: session.schoolId },
            data: {
                ...data,
                email: data.email || null,
                address: data.address || null,
                experience: data.experience || null,
                photograph: data.photograph || null,
            }
        });

        revalidatePath('/school/teachers');
        revalidatePath(`/school/teachers/${id}/edit`);
        return { success: true, message: 'Teacher updated successfully' };
    } catch (error: any) {
        console.error('Update Teacher Error:', error);
        return { message: 'Failed to update teacher' };
    }
}
