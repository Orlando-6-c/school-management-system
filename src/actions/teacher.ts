'use server';

import { getSession } from '@/lib/session';
import db from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { hashPassword } from '@/lib/auth';

const teacherSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email address"),
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
    // Email is now mandatory, so no longer filtering it out.
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
        const newTeacher = await db.$transaction(async (tx) => {
            const teacher = await tx.teacher.create({
                data: {
                    schoolId: session.schoolId!,
                    ...data,
                    // Ensure explicit nulls for optional fields if they are missing in data object
                    address: data.address || null,
                    experience: data.experience || null,
                    photograph: data.photograph || null,
                }
            });

            // Create User Account for the Teacher
            const hashedPassword = await hashPassword("password"); // Temporary default password

            await tx.user.create({
                data: {
                    schoolId: session.schoolId!,
                    username: teacher.email, // Using teacher's email as username
                    password: hashedPassword,
                    role: 'Teacher', // Assign 'Teacher' role
                    isActive: true,
                }
            });

            return teacher;
        });

        revalidatePath('/school/teachers');
        return { success: true, message: 'Teacher added successfully', teacherId: newTeacher.id };
    } catch (error: any) {
        console.error('Add Teacher Error:', error);
        if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
            return { message: 'A teacher with this email already exists in this school.' };
        }
        return { message: error.message || 'Failed to add teacher' };
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
                email: data.email || undefined,
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

export async function deleteTeacher(teacherId: string, reason?: string) {
    const session = await getSession();
    if (session.role !== 'SchoolAdmin' || !session.schoolId) {
        return { success: false, message: 'Unauthorized' };
    }

    try {
        await db.$transaction(async (tx) => {
            const teacher = await tx.teacher.update({
                where: { id: teacherId, schoolId: session.schoolId! },
                data: {
                    isActive: false,
                    deletedAt: new Date(),
                },
            });

            if (!teacher) {
                throw new Error('Teacher not found or not part of this school.');
            }

            // Also deactivate the corresponding user account
            await tx.user.updateMany({
                where: {
                    username: teacher.email, // Using teacher's email as username
                    schoolId: session.schoolId!,
                },
                data: {
                    isActive: false,
                },
            });

            // Create audit log entry
            await tx.auditLog.create({
                data: {
                    schoolId: session.schoolId!,
                    actorId: session.userId,
                    actorType: 'User', // Assuming admin is a 'User'
                    action: 'soft_delete_teacher',
                    targetId: teacher.id,
                    targetType: 'Teacher',
                    reason: reason,
                },
            });
        });

        revalidatePath('/school/teachers');
        return { success: true, message: 'Teacher deleted successfully.' };
    } catch (error: any) {
        return { success: false, message: 'Failed to delete teacher.' };
    }
}
