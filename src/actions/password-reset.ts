'use server';

import db from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { sendPasswordResetEmail } from '@/lib/email';
import { z } from 'zod';
import crypto from 'crypto';
import { redirect } from 'next/navigation';

const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

export type ResetRequestState = { success?: boolean; message?: string };
export type ResetConfirmState = { success?: boolean; message?: string; errors?: Record<string, string[]> };

// ── Step 1: Request reset ──────────────────────────────────────────────────────

const requestSchema = z.object({
    email: z.string().email('Enter a valid email address'),
    schoolSlug: z.string().optional(),
});

export async function requestPasswordReset(
    prevState: ResetRequestState | undefined,
    formData: FormData,
): Promise<ResetRequestState> {
    const result = requestSchema.safeParse(Object.fromEntries(formData));
    if (!result.success) return { message: result.error.issues[0]?.message ?? 'Invalid input' };

    const { email, schoolSlug } = result.data;

    const where: Record<string, unknown> = { email };
    if (schoolSlug) {
        const school = await db.school.findUnique({ where: { slug: schoolSlug } });
        if (school) where.schoolId = school.id;
    }

    const user = await db.user.findFirst({ where, include: { school: { select: { slug: true } } } });

    // Always return success to avoid user enumeration
    if (!user || !user.email) {
        return { success: true, message: "If that email is registered, you'll receive a reset link shortly." };
    }

    // Invalidate old tokens for this user
    await db.passwordResetToken.deleteMany({ where: { userId: user.id } });

    const token = crypto.randomBytes(32).toString('hex');
    await db.passwordResetToken.create({
        data: { token, userId: user.id, expiresAt: new Date(Date.now() + RESET_TTL_MS) },
    });

    await sendPasswordResetEmail({ to: user.email, username: user.username, token });

    return { success: true, message: "If that email is registered, you'll receive a reset link shortly." };
}

// ── Step 2: Set new password ───────────────────────────────────────────────────

const confirmSchema = z.object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });

export async function confirmPasswordReset(
    token: string,
    prevState: ResetConfirmState | undefined,
    formData: FormData,
): Promise<ResetConfirmState> {
    const resetToken = await db.passwordResetToken.findUnique({
        where: { token },
        include: { user: true },
    });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
        return { message: 'This reset link is invalid or has expired. Please request a new one.' };
    }

    const result = confirmSchema.safeParse(Object.fromEntries(formData));
    if (!result.success) return { errors: result.error.flatten().fieldErrors };

    const { password } = result.data;

    await db.$transaction([
        db.user.update({
            where: { id: resetToken.userId },
            data: { password: await hashPassword(password), loginAttempts: 0, lockedUntil: null },
        }),
        db.passwordResetToken.update({
            where: { id: resetToken.id },
            data: { usedAt: new Date() },
        }),
    ]);

    redirect('/login?reset=success');
}
