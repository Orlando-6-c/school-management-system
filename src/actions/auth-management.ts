'use server';

import { getSession } from '@/lib/session';
import { hasPermission } from '@/lib/authz';
import db from '@/lib/db';
import { hashPassword, verifyPassword } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
}).refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
});

export type ChangePasswordState = {
    success?: boolean;
    message?: string;
    errors?: { currentPassword?: string[]; newPassword?: string[]; confirmPassword?: string[] };
};

export async function changeOwnPassword(
    prevState: ChangePasswordState | undefined,
    formData: FormData,
): Promise<ChangePasswordState> {
    const session = await getSession();
    if (!session.userId || !session.schoolId) return { success: false, message: 'Not authenticated' };

    const result = changePasswordSchema.safeParse(Object.fromEntries(formData));
    if (!result.success) return { errors: result.error.flatten().fieldErrors };

    const { currentPassword, newPassword } = result.data;

    const user = await db.user.findUnique({ where: { id: session.userId } });
    if (!user) return { success: false, message: 'User not found' };

    if (!(await verifyPassword(currentPassword, user.password))) {
        return { errors: { currentPassword: ['Current password is incorrect'] } };
    }

    await db.user.update({
        where: { id: user.id },
        data: { password: await hashPassword(newPassword), loginAttempts: 0, lockedUntil: null },
    });

    return { success: true, message: 'Password changed successfully' };
}

export async function resetUserPassword(targetType: 'Student' | 'Teacher' | 'Staff', targetId: string) {
    const session = await getSession();
    if (!session.schoolId || !(await hasPermission('users', 'edit'))) {
        return { success: false, message: 'Unauthorized access' };
    }

    try {
        let user = null;
        if (targetType === 'Student') {
            user = await db.user.findFirst({ where: { studentId: targetId } });
        } else if (targetType === 'Teacher') {
            user = await db.user.findFirst({ where: { teacherId: targetId } });
        } else if (targetType === 'Staff') {
            user = await db.user.findFirst({ where: { staffId: targetId } });
        }

        if (!user) {
            return { success: false, message: 'No linked user account found for this entity.' };
        }

        let newPassword = '';
        if (targetType === 'Student') {
            const student = await db.student.findUnique({ where: { id: targetId } });
            if (!student) return { success: false, message: 'Student missing' };
            // Format to DDMMYYYY strictly securely natively
            newPassword = `${student.dateOfBirth.getDate().toString().padStart(2, '0')}${(student.dateOfBirth.getMonth() + 1).toString().padStart(2, '0')}${student.dateOfBirth.getFullYear()}`;
        } else {
            // For Teacher/Staff, random strong alphanumeric
            newPassword = Math.random().toString(36).slice(-8);
        }

        const hashedPassword = await hashPassword(newPassword);

        await db.user.update({
            where: { id: user.id },
            data: { password: hashedPassword }
        });

        revalidatePath(`/school/${targetType.toLowerCase()}s/${targetId}/edit`);

        return {
            success: true,
            message: 'Password reset successfully.',
            tempPassword: newPassword,
            username: user.username
        };
    } catch (e: any) {
        console.error('Reset User Password Error:', e);
        return { success: false, message: 'Failed to reset user password. Internal server error.' };
    }
}
