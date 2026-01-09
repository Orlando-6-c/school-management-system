'use server';

import { getSession } from '@/lib/session';
import { hashPassword, verifyPassword } from '@/lib/auth';
import db from '@/lib/db';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const loginSchema = z.object({
    username: z.string().min(1, 'Username is required'),
    password: z.string().min(1, 'Password is required'),
    schoolSlug: z.string().optional(),
});

export type LoginState = {
    message?: string;
    errors?: {
        username?: string[];
        password?: string[];
        schoolSlug?: string[];
    };
};

export async function login(prevState: LoginState | undefined, formData: FormData): Promise<LoginState> {
    const result = loginSchema.safeParse(Object.fromEntries(formData));

    if (!result.success) {
        return {
            errors: result.error.flatten().fieldErrors,
        };
    }

    const { username, password, schoolSlug } = result.data;
    const session = await getSession();

    // 1. Check SuperAdmin
    // SuperAdmin doesn't have a schoolSlug context for login typically, OR they can login to global dashboard
    // We assume no schoolSlug provided = SuperAdmin attempt or explicit Global Login
    if (!schoolSlug) {
        const superAdmin = await db.superAdmin.findUnique({
            where: { username },
        });

        if (superAdmin && (await verifyPassword(password, superAdmin.password))) {
            session.userId = superAdmin.id;
            session.username = superAdmin.username;
            session.role = 'SuperAdmin';
            session.isSuperAdmin = true;
            session.schoolId = null;
            session.schoolSlug = null;
            await session.save();
            redirect('/admin');
        }
    }

    // 2. Check School User
    // Requires schoolSlug to identify the school first? 
    // If schoolSlug is provided, we look up the school, then the user in that school.
    // If no schoolSlug, we can't easily find the user unless username is globally unique (but schema says username+school is unique).
    // So schoolSlug is required for school users.

    // 2. Check for User across schools if slug is missing
    if (!schoolSlug) {
        // Try to find if this username exists in ANY school
        const users = await db.user.findMany({
            where: { username },
            include: { school: true },
        });

        if (users.length === 0) {
            return { message: 'Invalid credentials' };
        }

        if (users.length > 1) {
            return { message: 'Multiple users found. Please provide School Slug.' };
        }

        const user = users[0];
        if (!user.isActive) {
            return { message: 'Your account has been disabled.' };
        }
        if (await verifyPassword(password, user.password)) {
            session.userId = user.id;
            session.username = user.username;
            session.role = user.role;
            session.schoolId = user.schoolId;
            session.schoolSlug = user.school.slug;
            session.isSuperAdmin = false;
            await session.save();
            redirect('/dashboard');
        }
    } else {
        // Specific school login
        const school = await db.school.findUnique({
            where: { slug: schoolSlug },
        });

        if (!school) {
            return { message: 'School not found' };
        }

        const user = await db.user.findUnique({
            where: {
                username_schoolId: {
                    username,
                    schoolId: school.id,
                },
            },
        });

        if (user && user.isActive && (await verifyPassword(password, user.password))) {
            session.userId = user.id;
            session.username = user.username;
            session.role = user.role;
            session.schoolId = school.id;
            session.schoolSlug = school.slug;
            session.isSuperAdmin = false;
            await session.save();
            await session.save();
            if (user.role === 'SchoolAdmin') {
                redirect('/school');
            }
            redirect('/dashboard');
        }
    }

    return { message: 'Invalid credentials' };
}

export async function logout() {
    const session = await getSession();
    session.destroy();
    redirect('/login');
}
