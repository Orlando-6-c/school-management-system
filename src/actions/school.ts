'use server';

import db from '@/lib/db';
import { getSession } from '@/lib/session';
import { hashPassword } from '@/lib/auth';
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

            await tx.user.create({
                data: {
                    username: adminUsername,
                    password: hashedPassword,
                    role: 'SchoolAdmin',
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
