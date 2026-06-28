'use server';

import { getSession } from '@/lib/session';
import { verifyPassword } from '@/lib/auth';
import db from '@/lib/db';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

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

function roleRedirect(role: string): never {
    switch (role) {
        case 'SchoolAdmin':
        case 'Finance':
            redirect('/school');
        case 'Teacher':
            redirect('/school/teacher');
        case 'Student':
            redirect('/portal/student');
        case 'Parent':
            redirect('/portal/parent');
        default:
            redirect('/school');
    }
}

function lockoutMessage(lockedUntil: Date): string {
    const mins = Math.ceil((lockedUntil.getTime() - Date.now()) / 60000);
    return `Account locked due to too many failed attempts. Try again in ${mins} minute${mins === 1 ? '' : 's'}.`;
}

export async function login(prevState: LoginState | undefined, formData: FormData): Promise<LoginState> {
    const result = loginSchema.safeParse(Object.fromEntries(formData));

    if (!result.success) {
        return { errors: result.error.flatten().fieldErrors };
    }

    const { username, password, schoolSlug } = result.data;
    const session = await getSession();
    const now = new Date();

    // ── SuperAdmin path ────────────────────────────────────────────────────────
    if (!schoolSlug) {
        const superAdmin = await db.superAdmin.findUnique({ where: { username } });

        if (superAdmin) {
            // Lockout check
            if (superAdmin.lockedUntil && superAdmin.lockedUntil > now) {
                return { message: lockoutMessage(superAdmin.lockedUntil) };
            }

            if (await verifyPassword(password, superAdmin.password)) {
                // Success — reset attempts
                await db.superAdmin.update({
                    where: { id: superAdmin.id },
                    data: { loginAttempts: 0, lockedUntil: null },
                });
                session.userId = superAdmin.id;
                session.username = superAdmin.username;
                session.role = 'SuperAdmin';
                session.isSuperAdmin = true;
                session.schoolId = null;
                session.schoolSlug = null;
                await session.save();
                redirect('/admin');
            }

            // Failed — increment attempts
            const attempts = superAdmin.loginAttempts + 1;
            await db.superAdmin.update({
                where: { id: superAdmin.id },
                data: {
                    loginAttempts: attempts,
                    lockedUntil: attempts >= MAX_ATTEMPTS ? new Date(Date.now() + LOCKOUT_MS) : null,
                },
            });
        }
    }

    // ── School User — no slug: try to find unique match ───────────────────────
    if (!schoolSlug) {
        const users = await db.user.findMany({
            where: { username },
            select: {
                id: true, username: true, password: true, role: true, schoolId: true,
                isActive: true, loginAttempts: true, lockedUntil: true,
                school: { select: { slug: true } },
            },
        });

        if (users.length === 0) return { message: 'Invalid credentials' };
        if (users.length > 1) return { message: 'Multiple accounts found. Please enter your school slug.' };

        const user = users[0];

        if (!user.isActive) return { message: 'Your account has been disabled.' };

        if (user.lockedUntil && user.lockedUntil > now) {
            return { message: lockoutMessage(user.lockedUntil) };
        }

        if (await verifyPassword(password, user.password)) {
            await db.user.update({
                where: { id: user.id },
                data: { loginAttempts: 0, lockedUntil: null },
            });
            session.userId = user.id;
            session.username = user.username;
            session.role = user.role;
            session.schoolId = user.schoolId;
            session.schoolSlug = user.school.slug;
            session.isSuperAdmin = false;
            await session.save();
            roleRedirect(user.role);
        }

        const attempts = user.loginAttempts + 1;
        await db.user.update({
            where: { id: user.id },
            data: {
                loginAttempts: attempts,
                lockedUntil: attempts >= MAX_ATTEMPTS ? new Date(Date.now() + LOCKOUT_MS) : null,
            },
        });

        return { message: 'Invalid credentials' };
    }

    // ── School User — slug provided ────────────────────────────────────────────
    const school = await db.school.findUnique({ where: { slug: schoolSlug }, select: { id: true, slug: true } });
    if (!school) return { message: 'School not found' };

    const user = await db.user.findUnique({
        where: { username_schoolId: { username, schoolId: school.id } },
    });

    if (!user) return { message: 'Invalid credentials' };
    if (!user.isActive) return { message: 'Your account has been disabled.' };

    if (user.lockedUntil && user.lockedUntil > now) {
        return { message: lockoutMessage(user.lockedUntil) };
    }

    if (await verifyPassword(password, user.password)) {
        await db.user.update({
            where: { id: user.id },
            data: { loginAttempts: 0, lockedUntil: null },
        });
        session.userId = user.id;
        session.username = user.username;
        session.role = user.role;
        session.schoolId = school.id;
        session.schoolSlug = school.slug;
        session.isSuperAdmin = false;
        await session.save();
        roleRedirect(user.role);
    }

    const attempts = user.loginAttempts + 1;
    await db.user.update({
        where: { id: user.id },
        data: {
            loginAttempts: attempts,
            lockedUntil: attempts >= MAX_ATTEMPTS ? new Date(Date.now() + LOCKOUT_MS) : null,
        },
    });

    return { message: 'Invalid credentials' };
}

export async function logout() {
    const session = await getSession();
    session.destroy();
    redirect('/login');
}
