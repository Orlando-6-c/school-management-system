'use server';

import { getSession } from '@/lib/session';
import { hasPermission } from '@/lib/authz';
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
    tempPassword?: string;
};

export async function addStaff(prevState: StaffState | undefined, formData: FormData): Promise<StaffState> {
    const session = await getSession();
    if (!session.schoolId || !(await hasPermission('staff', 'create'))) {
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
        let newStaffObj: any = null;
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
            if (data.userRole === 'Finance' || data.userRole === 'Staff' || data.userRole === 'SchoolAdmin') {
                const tempPassword = Math.random().toString(36).slice(-8);
                const hashedPassword = await hashPassword(tempPassword);

                // Check if user already exists
                const existingUser = await tx.user.findFirst({
                    where: {
                        username: data.cnic,
                        schoolId: session.schoolId!
                    }
                });

                if (existingUser) {
                    throw new Error(`User with username ${data.cnic} already exists.`);
                }

                await tx.user.create({
                    data: {
                        schoolId: session.schoolId!,
                        username: data.cnic,
                        password: hashedPassword,
                        role: data.userRole as any,
                        staffId: staff.id,
                        isActive: true,
                    }
                });
                return { ...staff, tempPassword };
            }
            return staff;
        });

        revalidatePath('/school/staff');
        return { success: true, message: 'Staff member added successfully.', tempPassword: newStaffObj?.tempPassword };

    } catch (error: any) {
        console.error('Add Staff Error:', error);
        if (error.code === 'P2002') {
            return { message: 'A staff member with this CNIC already exists.' };
        }
        return { message: error.message || 'Failed to add staff member.' };
    }
}

export async function getStaff() {
    const session = await getSession();
    if (!session.schoolId || !(await hasPermission('staff', 'view'))) return [];
    return db.staff.findMany({
        where: { schoolId: session.schoolId, isActive: true },
        orderBy: { name: 'asc' },
    });
}

export async function getStaffById(id: string) {
    const session = await getSession();
    if (!session.schoolId || !(await hasPermission('staff', 'view'))) return null;
    return db.staff.findUnique({ where: { id, schoolId: session.schoolId } });
}

const updateStaffSchema = staffSchema.partial().extend({ id: z.string() });

export async function updateStaff(prevState: StaffState | undefined, formData: FormData): Promise<StaffState> {
    const session = await getSession();
    if (!session.schoolId || !(await hasPermission('staff', 'edit'))) return { message: 'Unauthorized' };

    const rawData = Object.fromEntries(formData.entries());
    if (rawData.photograph === '') delete rawData.photograph;

    const result = updateStaffSchema.safeParse(rawData);
    if (!result.success) return { errors: result.error.flatten().fieldErrors, message: 'Validation failed.' };

    const { id, ...data } = result.data;
    try {
        await db.staff.update({
            where: { id, schoolId: session.schoolId },
            data: { ...data, photograph: data.photograph ?? undefined },
        });
        revalidatePath('/school/staff');
        revalidatePath(`/school/staff/${id}/edit`);
        return { success: true, message: 'Staff member updated.' };
    } catch (error: any) {
        return { message: error.message || 'Failed to update staff member.' };
    }
}

export async function deleteStaff(id: string) {
    const session = await getSession();
    if (!session.schoolId || !(await hasPermission('staff', 'delete'))) return { success: false, message: 'Unauthorized' };
    try {
        await db.staff.update({ where: { id, schoolId: session.schoolId }, data: { isActive: false } });
        revalidatePath('/school/staff');
        return { success: true, message: 'Staff member removed.' };
    } catch {
        return { success: false, message: 'Failed to remove staff member.' };
    }
}
