'use server';

import db from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import {
    requirePermission,
    getCurrentUserWithPermissions,
    ForbiddenError,
    UnauthorizedError,
} from '@/lib/authz';
import { normalizePermissionMap } from '@/lib/permissions';
import { sendWelcomeEmail } from '@/lib/email';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

type ActionResult = { success: boolean; message?: string };

function handleError(e: unknown): ActionResult {
    if (e instanceof UnauthorizedError) return { success: false, message: 'Not authenticated.' };
    if (e instanceof ForbiddenError) return { success: false, message: 'You do not have permission to do this.' };
    if (typeof e === 'object' && e && 'code' in e && (e as any).code === 'P2002') {
        return { success: false, message: 'That name/username is already taken.' };
    }
    console.error('User management error:', e);
    return { success: false, message: 'Something went wrong. Please try again.' };
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

const createUserSchema = z.object({
    username: z.string().min(3, 'Username must be at least 3 characters'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    roleId: z.string().min(1, 'Please select a role'),
    email: z.string().email().optional().or(z.literal('')),
});

export async function createSchoolUser(formData: FormData): Promise<ActionResult> {
    try {
        const actor = await requirePermission('users', 'create');
        if (!actor.schoolId) return { success: false, message: 'No school context.' };

        const parsed = createUserSchema.safeParse(Object.fromEntries(formData));
        if (!parsed.success) {
            return { success: false, message: parsed.error.issues[0]?.message ?? 'Invalid input.' };
        }
        const { username, password, roleId, email } = parsed.data;

        // Role must belong to this school.
        const role = await db.role.findFirst({ where: { id: roleId, schoolId: actor.schoolId } });
        if (!role) return { success: false, message: 'Invalid role.' };

        const school = await db.school.findUnique({ where: { id: actor.schoolId }, select: { name: true, slug: true } });

        await db.user.create({
            data: {
                username,
                password: await hashPassword(password),
                email: email || null,
                role: 'ReadOnly', // legacy enum default; real access comes from roleId
                roleId,
                schoolId: actor.schoolId,
                isActive: true,
            },
        });

        // Fire-and-forget welcome email
        if (email && school) {
            sendWelcomeEmail({
                to: email,
                username,
                tempPassword: password,
                schoolName: school.name,
                schoolSlug: school.slug,
            }).catch(() => {});
        }

        revalidatePath('/school/users');
        return { success: true, message: 'User created.' };
    } catch (e) {
        return handleError(e);
    }
}

export async function setUserRole(userId: string, roleId: string): Promise<ActionResult> {
    try {
        const actor = await requirePermission('users', 'edit');
        const role = await db.role.findFirst({ where: { id: roleId, schoolId: actor.schoolId ?? '' } });
        if (!role) return { success: false, message: 'Invalid role.' };
        // Ensure the target user is in the same school.
        const target = await db.user.findFirst({ where: { id: userId, schoolId: actor.schoolId ?? '' } });
        if (!target) return { success: false, message: 'User not found.' };

        await db.user.update({ where: { id: userId }, data: { roleId } });
        revalidatePath('/school/users');
        return { success: true, message: 'Role updated.' };
    } catch (e) {
        return handleError(e);
    }
}

export async function setUserActive(userId: string, isActive: boolean): Promise<ActionResult> {
    try {
        const actor = await requirePermission('users', 'edit');
        const target = await db.user.findFirst({ where: { id: userId, schoolId: actor.schoolId ?? '' } });
        if (!target) return { success: false, message: 'User not found.' };
        if (target.id === actor.userId) return { success: false, message: 'You cannot deactivate yourself.' };

        await db.user.update({ where: { id: userId }, data: { isActive } });
        revalidatePath('/school/users');
        return { success: true, message: isActive ? 'User activated.' : 'User deactivated.' };
    } catch (e) {
        return handleError(e);
    }
}

export async function setUserOverride(
    userId: string,
    override: { grant?: Record<string, string[]>; revoke?: Record<string, string[]> }
): Promise<ActionResult> {
    try {
        const actor = await requirePermission('users', 'edit');
        const target = await db.user.findFirst({ where: { id: userId, schoolId: actor.schoolId ?? '' } });
        if (!target) return { success: false, message: 'User not found.' };

        const clean = {
            grant: normalizePermissionMap(override.grant),
            revoke: normalizePermissionMap(override.revoke),
        };
        await db.user.update({ where: { id: userId }, data: { permissionOverride: clean } });
        revalidatePath('/school/users');
        return { success: true, message: 'Overrides saved.' };
    } catch (e) {
        return handleError(e);
    }
}

// ---------------------------------------------------------------------------
// Roles
// ---------------------------------------------------------------------------

const createRoleSchema = z.object({
    name: z.string().min(2, 'Role name must be at least 2 characters'),
    description: z.string().optional(),
});

export async function createRole(formData: FormData): Promise<ActionResult> {
    try {
        const actor = await requirePermission('users', 'create');
        if (!actor.schoolId) return { success: false, message: 'No school context.' };
        const parsed = createRoleSchema.safeParse(Object.fromEntries(formData));
        if (!parsed.success) {
            return { success: false, message: parsed.error.issues[0]?.message ?? 'Invalid input.' };
        }
        const cloneFromId = formData.get('cloneFromId')?.toString();
        let permissions: unknown = {};
        if (cloneFromId) {
            const src = await db.role.findFirst({ where: { id: cloneFromId, schoolId: actor.schoolId } });
            if (src) permissions = src.permissions;
        }

        await db.role.create({
            data: {
                schoolId: actor.schoolId,
                name: parsed.data.name,
                description: parsed.data.description || null,
                isSystem: false,
                isOwner: false,
                permissions: normalizePermissionMap(permissions),
            },
        });
        revalidatePath('/school/users/roles');
        return { success: true, message: 'Role created.' };
    } catch (e) {
        return handleError(e);
    }
}

export async function updateRolePermissions(
    roleId: string,
    permissions: Record<string, string[]>
): Promise<ActionResult> {
    try {
        const actor = await requirePermission('users', 'edit');
        const role = await db.role.findFirst({ where: { id: roleId, schoolId: actor.schoolId ?? '' } });
        if (!role) return { success: false, message: 'Role not found.' };
        if (role.isOwner) return { success: false, message: 'The Owner role is locked and cannot be edited.' };

        await db.role.update({
            where: { id: roleId },
            data: { permissions: normalizePermissionMap(permissions) },
        });
        revalidatePath('/school/users/roles');
        return { success: true, message: 'Permissions saved.' };
    } catch (e) {
        return handleError(e);
    }
}

export async function deleteRole(roleId: string): Promise<ActionResult> {
    try {
        const actor = await requirePermission('users', 'delete');
        const role = await db.role.findFirst({
            where: { id: roleId, schoolId: actor.schoolId ?? '' },
            include: { _count: { select: { users: true } } },
        });
        if (!role) return { success: false, message: 'Role not found.' };
        if (role.isOwner) return { success: false, message: 'The Owner role cannot be deleted.' };
        if (role._count.users > 0) {
            return { success: false, message: 'Reassign its users before deleting this role.' };
        }
        await db.role.delete({ where: { id: roleId } });
        revalidatePath('/school/users/roles');
        return { success: true, message: 'Role deleted.' };
    } catch (e) {
        return handleError(e);
    }
}

/** Read helper for server components. */
export async function listSchoolRoles() {
    const actor = await getCurrentUserWithPermissions();
    if (!actor?.schoolId) return [];
    return db.role.findMany({
        where: { schoolId: actor.schoolId },
        include: { _count: { select: { users: true } } },
        orderBy: [{ isOwner: 'desc' }, { name: 'asc' }],
    });
}
