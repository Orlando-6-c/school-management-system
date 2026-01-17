'use server';

import { getSession } from '@/lib/session';
import db from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { hashPassword } from '@/lib/auth';
import { Prisma } from '@prisma/client';

const staffSchema = z.object({
    name: z.string().min(1, "Name is required"),
    fatherName: z.string().min(1, "Father Name is required"),
    cnic: z.string().min(13, "CNIC must be at least 13 characters"),
    dateOfBirth: z.coerce.date(),
    contact: z.string().min(10, "Valid contact number is required"),
    gender: z.enum(['Male', 'Female']),
    role: z.string().min(1, "Role is required"), // Store 'Finance' or other staff roles here as string
    workingHours: z.string().min(1, "Working hours are required"),
    photograph: z.string().optional(),
    userRole: z.enum(['Finance', 'Staff', 'SchoolAdmin']).optional(), // For determining if a User account is needed
});

export type StaffState = {
    success?: boolean;
    message?: string;
    errors?: Record<string, string[]>;
    staffId?: string;
};

export async function addStaff(prevState: StaffState | undefined, formData: FormData): Promise<StaffState> {
    const session = await getSession();
    if (!session.schoolId || !(session.role === 'SchoolAdmin' || session.role === 'SuperAdmin')) {
        return { message: 'Unauthorized' };
    }

    const rawData = Object.fromEntries(formData.entries());

    // Cleanup optional fields
    if (rawData.photograph === '') delete rawData.photograph;

    const result = staffSchema.safeParse(rawData);

    if (!result.success) {
        return {
            errors: result.error.flatten().fieldErrors,
            message: 'Validation failed. Check your inputs.'
        };
    }

    const data = result.data;

    try {
        await db.$transaction(async (tx) => {
            // Create Staff Record
            const staff = await tx.staff.create({
                data: {
                    schoolId: session.schoolId!,
                    name: data.name,
                    fatherName: data.fatherName,
                    cnic: data.cnic,
                    dateOfBirth: data.dateOfBirth,
                    contact: data.contact,
                    gender: data.gender,
                    role: data.role, // This is the job title/designation
                    workingHours: data.workingHours,
                    photograph: data.photograph || null,
                }
            });

            // Create User Account if applicable (e.g. Finance)
            if (data.userRole === 'Finance') {
                const hashedPassword = await hashPassword("password123"); // Default password

                // Check if user already exists
                const existingUser = await tx.user.findFirst({
                    where: {
                        username: data.contact, // Using contact as username for now? Or maybe add an email field?
                        schoolId: session.schoolId!
                    }
                });

                if (existingUser) {
                    throw new Error(`User with username ${data.contact} already exists.`);
                }

                // Using contact number as username for staff if email is not present? 
                // Let's stick to the prompt's simplicity. The prompt said "If Finance is selected... create a user".
                // We'll use the staff name or contact as username. Let's use contact for uniqueness.

                await tx.user.create({
                    data: {
                        schoolId: session.schoolId!,
                        username: `finance_${data.contact}`, // Prefix to avoid collisions? or just contact.
                        password: hashedPassword,
                        role: 'Finance',
                        isActive: true,
                    }
                });
            }
        });

        revalidatePath('/school/staff'); // Assuming this path exists or will exist
        return { success: true, message: 'Staff member added successfully.' };

    } catch (error: any) {
        console.error('Add Staff Error:', error);
        if (error.code === 'P2002') {
            return { message: 'A staff member with this CNIC already exists.' };
        }
        return { message: error.message || 'Failed to add staff member.' };
    }
}
