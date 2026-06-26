import { SessionOptions } from 'iron-session';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { env } from './env';

export interface SessionData {
    userId: string;
    role: string;
    schoolId: string | null; // Null for SuperAdmin managing multiple schools
    schoolSlug: string | null;
    isSuperAdmin?: boolean;
    username: string;
}

export const sessionOptions: SessionOptions = {
    password: env.SESSION_SECRET,
    cookieName: 'school_management_session',
    cookieOptions: {
        secure: env.NODE_ENV === 'production',
    },
};

export async function getSession() {
    const cookieStore = await cookies();
    return getIronSession<SessionData>(cookieStore, sessionOptions);
}
