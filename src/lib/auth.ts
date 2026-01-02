import { hash, compare } from 'bcryptjs';
import { getSession } from './session';

export async function hashPassword(password: string): Promise<string> {
    return hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return compare(password, hash);
}

export async function getCurrentUser() {
    const session = await getSession();
    if (!session.userId) return null;

    return {
        userId: session.userId,
        username: session.username,
        role: session.role,
        schoolId: session.schoolId,
        schoolSlug: session.schoolSlug,
        isSuperAdmin: session.isSuperAdmin,
    };
}
