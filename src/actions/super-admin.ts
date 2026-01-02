'use server';

import { getSession } from '@/lib/session';
import { hashPassword, verifyPassword } from '@/lib/auth';
import db from '@/lib/db';
import { z } from 'zod';

const updateCredentialsSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newUsername: z.string().optional(),
    newPassword: z.string().min(6, 'New password must be at least 6 characters').optional().or(z.literal('')),
});

export type UpdateCredentialsState = {
    message?: string;
    success?: boolean;
    errors?: {
        currentPassword?: string[];
        newUsername?: string[];
        newPassword?: string[];
    };
};

export async function updateSuperAdminCredentials(prevState: UpdateCredentialsState | undefined, formData: FormData): Promise<UpdateCredentialsState> {
    const session = await getSession();

    if (!session.isSuperAdmin || !session.userId) {
        return { message: 'Unauthorized', success: false };
    }

    const result = updateCredentialsSchema.safeParse(Object.fromEntries(formData));

    if (!result.success) {
        return {
            errors: result.error.flatten().fieldErrors,
            success: false,
        };
    }

    const { currentPassword, newUsername, newPassword } = result.data;

    try {
        const superAdmin = await db.superAdmin.findUnique({
            where: { id: session.userId },
        });

        if (!superAdmin) {
            return { message: 'Super Admin not found', success: false };
        }

        const isPasswordValid = await verifyPassword(currentPassword, superAdmin.password);
        if (!isPasswordValid) {
            return {
                errors: {
                    currentPassword: ['Incorrect current password'],
                },
                success: false,
            };
        }

        const updateData: any = {};
        if (newUsername && newUsername !== superAdmin.username) {
            // Check uniqueness
            const existing = await db.superAdmin.findUnique({ where: { username: newUsername } });
            if (existing) {
                return {
                    errors: { newUsername: ['Username already taken'] },
                    success: false
                };
            }
            updateData.username = newUsername;
        }

        if (newPassword) {
            updateData.password = await hashPassword(newPassword);
        }

        if (Object.keys(updateData).length === 0) {
            return { message: 'No changes made', success: true };
        }

        await db.superAdmin.update({
            where: { id: session.userId },
            data: updateData,
        });

        // Update session if username changed
        if (updateData.username) {
            session.username = updateData.username;
            await session.save();
        }

        return { message: 'Credentials updated successfully', success: true };
    } catch (error) {
        console.error('Failed to update credentials:', error);
        return { message: 'Failed to update credentials', success: false };
    }
}
