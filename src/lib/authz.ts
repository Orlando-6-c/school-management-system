import 'server-only';
import { getSession } from './session';
import db from './db';
import {
    resolvePermissions,
    type PermissionOverride,
} from './permissions';
import type { Action, ModuleKey } from './modules';

export class UnauthorizedError extends Error {
    constructor(message = 'Not authenticated') {
        super(message);
        this.name = 'UnauthorizedError';
    }
}

export class ForbiddenError extends Error {
    constructor(message = 'You do not have permission to perform this action') {
        super(message);
        this.name = 'ForbiddenError';
    }
}

export interface CurrentUser {
    userId: string;
    username: string;
    role: string;
    schoolId: string | null;
    schoolSlug: string | null;
    isSuperAdmin: boolean;
    permissions: Record<ModuleKey, Action[]>;
}

/**
 * Load the session user along with their resolved (role + override) permissions.
 * Returns null when not logged in. SuperAdmins resolve to full access.
 */
export async function getCurrentUserWithPermissions(): Promise<CurrentUser | null> {
    const session = await getSession();
    if (!session.userId) return null;

    const isSuperAdmin = !!session.isSuperAdmin;

    if (isSuperAdmin) {
        return {
            userId: session.userId,
            username: session.username,
            role: session.role,
            schoolId: session.schoolId,
            schoolSlug: session.schoolSlug,
            isSuperAdmin: true,
            permissions: resolvePermissions(null, null, true),
        };
    }

    const user = await db.user.findUnique({
        where: { id: session.userId },
        include: { role_: true },
    });

    if (!user) return null;

    const permissions = resolvePermissions(
        user.role_ ?? null,
        (user.permissionOverride as PermissionOverride | null) ?? null,
        false
    );

    return {
        userId: user.id,
        username: user.username,
        role: user.role,
        schoolId: user.schoolId,
        schoolSlug: session.schoolSlug,
        isSuperAdmin: false,
        permissions,
    };
}

/**
 * Gate a server action on a specific module/action permission. Throws
 * UnauthorizedError (not logged in) or ForbiddenError (logged in, no access).
 * Returns the current user on success.
 *
 * Usage (at the top of every server action):
 *   const user = await requirePermission('fees', 'create');
 */
export async function requirePermission(
    module: ModuleKey,
    action: Action
): Promise<CurrentUser> {
    const user = await getCurrentUserWithPermissions();
    if (!user) throw new UnauthorizedError();
    if (user.isSuperAdmin) return user; // Product owner bypass.
    if (!user.permissions[module]?.includes(action)) {
        throw new ForbiddenError();
    }
    return user;
}

/** Non-throwing check, handy in UI/server components. */
export function userCan(user: CurrentUser | null, module: ModuleKey, action: Action): boolean {
    if (!user) return false;
    if (user.isSuperAdmin) return true;
    return user.permissions[module]?.includes(action) ?? false;
}

/**
 * Non-throwing async permission check for use directly inside a guard, e.g.:
 *   if (!session.schoolId || !(await hasPermission('fees', 'create'))) { ... }
 * Returns false when not logged in or lacking the permission.
 */
export async function hasPermission(module: ModuleKey, action: Action): Promise<boolean> {
    const user = await getCurrentUserWithPermissions();
    return userCan(user, module, action);
}
