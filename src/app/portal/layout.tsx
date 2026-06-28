import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { logout } from '@/actions/auth';
import db from '@/lib/db';
import { GraduationCap, LogOut, School } from 'lucide-react';

export const runtime = 'nodejs';

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
    const session = await getSession();

    const portalRoles = ['Student', 'Parent', 'Teacher'];
    if (!session.userId || !portalRoles.includes(session.role)) {
        redirect('/login');
    }

    const school = session.schoolId
        ? await db.school.findUnique({ where: { id: session.schoolId }, select: { name: true } })
        : null;

    const roleLabel =
        session.role === 'Student' ? 'Student Portal'
            : session.role === 'Parent' ? 'Parent Portal'
                : 'Teacher Portal';

    return (
        <div className="min-h-screen bg-muted flex flex-col">
            <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm print:hidden">
                <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="bg-violet-700 p-1.5 rounded-lg shrink-0">
                            <School className="h-4 w-4 text-white" />
                        </div>
                        <div className="min-w-0">
                            <span className="font-bold text-gray-900 text-sm truncate block">
                                {school?.name ?? 'SchoolSys'}
                            </span>
                            <span className="text-xs text-violet-600 font-medium">{roleLabel}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        <div className="hidden sm:flex items-center gap-1.5 text-sm text-gray-600">
                            <GraduationCap className="h-4 w-4" />
                            <span className="font-medium">{session.username}</span>
                        </div>
                        <form action={logout}>
                            <button
                                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50"
                                title="Sign out"
                            >
                                <LogOut className="h-4 w-4" />
                                <span className="hidden sm:inline">Sign out</span>
                            </button>
                        </form>
                    </div>
                </div>
            </header>
            <main className="flex-1">{children}</main>
        </div>
    );
}
