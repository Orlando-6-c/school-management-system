'use server';

import db from '@/lib/db';
import { getSession } from '@/lib/session';
import { hashPassword } from '@/lib/auth';
import { seedRolesForSchool } from '@/lib/seed-roles';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const createSchoolSchema = z.object({
    name: z.string().min(1, 'School Name is required'),
    slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be URL-friendly'),
    adminUsername: z.string().min(3, 'Admin Username must be at least 3 chars'),
    adminPassword: z.string().min(6, 'Admin Password must be at least 6 chars'),
});

export type CreateSchoolState = {
    message?: string;
    errors?: {
        name?: string[];
        slug?: string[];
        adminUsername?: string[];
        adminPassword?: string[];
    };
};

export async function createSchool(prevState: CreateSchoolState | undefined, formData: FormData): Promise<CreateSchoolState> {
    const session = await getSession();
    if (!session.isSuperAdmin) {
        return { message: 'Unauthorized' };
    }

    const result = createSchoolSchema.safeParse(Object.fromEntries(formData));

    if (!result.success) {
        return {
            errors: result.error.flatten().fieldErrors,
        };
    }

    const { name, slug, adminUsername, adminPassword } = result.data;

    try {
        const existingSchool = await db.school.findUnique({
            where: { slug },
        });

        if (existingSchool) {
            return {
                errors: {
                    slug: ['School with this slug already exists'],
                },
            };
        }

        const hashedPassword = await hashPassword(adminPassword);

        await db.$transaction(async (tx) => {
            const school = await tx.school.create({
                data: {
                    name,
                    slug,
                    superAdminId: session.userId!,
                },
            });

            // Seed default role templates (Owner, Accountant, etc.) for this school.
            const ownerRole = await seedRolesForSchool(tx as any, school.id);
            const accountantRole = await (tx as any).role.findFirst({
                where: { schoolId: school.id, name: 'Accountant' },
            });

            // School admin → locked Owner role (full access).
            await tx.user.create({
                data: {
                    username: adminUsername,
                    password: hashedPassword,
                    role: 'SchoolAdmin',
                    roleId: ownerRole?.id ?? null,
                    schoolId: school.id,
                },
            });

            // Automate Clerk Creation → Accountant role.
            await tx.user.create({
                data: {
                    username: `${adminUsername}_finance`,
                    password: hashedPassword, // Same initial password
                    role: 'Finance',
                    roleId: accountantRole?.id ?? null,
                    schoolId: school.id,
                },
            });
        });

        revalidatePath('/admin/schools');
        return { message: 'School created successfully' };
    } catch (error: any) {
        console.error('Failed to create school:', error);
        if (error.code === 'P2002') {
            return { message: 'A school with this slug or admin username already exists.' };
        }
        return { message: 'Failed to create school. Please try again.' };
    }
}

export async function impersonateSchoolAdmin(schoolId: string) {
    try {
        const session = await getSession();
        if (!session.isSuperAdmin) {
            redirect('/admin');
        }

        const school = await db.school.findUnique({
            where: { id: schoolId },
            include: {
                users: {
                    where: { role: 'SchoolAdmin' },
                    take: 1, // Take the first admin found
                },
            },
        });

        if (!school || school.users.length === 0) {
            redirect('/admin/schools');
        }

        const admin = school.users[0];

        session.userId = admin.id;
        session.username = admin.username;
        session.role = admin.role;
        session.schoolId = school.id;
        session.schoolSlug = school.slug;
        session.isSuperAdmin = true; // Keep super admin flag to allow switching back potentially, or just treat as impersonation
        // For now, let's treat them as regular user but maybe add a flag if needed.
        // The requirement says "Login as Admin".

        await session.save();
        redirect('/dashboard');
    } catch (error: any) {
        console.error('Impersonate School Admin Error:', error);
        redirect('/admin/schools');
    }
}

// ── Public self-serve school registration ──────────────────────────────────────

const registerSchoolSchema = z.object({
    schoolName: z.string().min(2, 'School name must be at least 2 characters'),
    schoolSlug: z
        .string()
        .min(3, 'Slug must be at least 3 characters')
        .max(60, 'Slug must be under 60 characters')
        .regex(/^[a-z0-9-]+$/, 'Slug may only contain lowercase letters, numbers and hyphens'),
    adminUsername: z.string().min(3, 'Username must be at least 3 characters').max(40).regex(/^\S+$/, 'Username cannot contain spaces'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
});

export type RegisterSchoolState = {
    success?: boolean;
    message?: string;
    errors?: Record<string, string[]>;
};

export async function registerSchool(
    prevState: RegisterSchoolState | undefined,
    formData: FormData,
): Promise<RegisterSchoolState> {
    const raw = Object.fromEntries(formData.entries());
    const result = registerSchoolSchema.safeParse(raw);

    if (!result.success) {
        return { errors: result.error.flatten().fieldErrors };
    }

    const { schoolName, schoolSlug, adminUsername, password } = result.data;

    try {
        const existing = await db.school.findUnique({ where: { slug: schoolSlug } });
        if (existing) {
            return { errors: { schoolSlug: ['This slug is already taken — choose another.'] } };
        }

        const hashedPassword = await hashPassword(password);
        let newAdmin: { id: string; username: string; role: string; schoolId: string } | null = null;
        let newSchool: { id: string; slug: string } | null = null;

        await db.$transaction(async (tx) => {
            const school = await tx.school.create({
                data: { name: schoolName, slug: schoolSlug },
            });
            newSchool = school;

            const ownerRole = await seedRolesForSchool(tx as any, school.id);

            const admin = await tx.user.create({
                data: {
                    username: adminUsername,
                    password: hashedPassword,
                    role: 'SchoolAdmin',
                    roleId: ownerRole?.id ?? null,
                    schoolId: school.id,
                    isActive: true,
                },
            });
            newAdmin = { id: admin.id, username: admin.username, role: admin.role, schoolId: admin.schoolId };
        });

        if (!newAdmin || !newSchool) throw new Error('Registration failed');

        // Auto-login the new admin
        const session = await getSession();
        session.userId = (newAdmin as any).id;
        session.username = (newAdmin as any).username;
        session.role = (newAdmin as any).role;
        session.schoolId = (newAdmin as any).schoolId;
        session.schoolSlug = (newSchool as any).slug;
        session.isSuperAdmin = false;
        await session.save();
    } catch (error: any) {
        console.error('registerSchool error:', error);
        if (error.code === 'P2002') {
            return { errors: { adminUsername: ['That username is already taken in this school.'] } };
        }
        return { message: error.message || 'Registration failed. Please try again.' };
    }

    redirect('/school');
}

export async function getSchools() {
    try {
        const session = await getSession();
        if (!session.isSuperAdmin) {
            return [];
        }

        return await db.school.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { students: true },
                },
            },
        });
    } catch (error: any) {
        console.error('Get Schools Error:', error);
        return [];
    }
}
