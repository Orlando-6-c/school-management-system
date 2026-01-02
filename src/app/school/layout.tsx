import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { logout } from '@/actions/auth';
import { LayoutDashboard, Users, BookOpen, Settings, LogOut, GraduationCap, School } from 'lucide-react';

export const runtime = 'nodejs';

export default async function SchoolLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getSession();

    if (!session.userId) {
        redirect('/login');
    }

    if (session.isSuperAdmin) {
        redirect('/admin');
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full z-10">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center space-x-2">
                        <School className="h-6 w-6 text-indigo-600" />
                        <h2 className="text-lg font-bold text-gray-900 truncate" title={session.schoolSlug || 'School'}>
                            {session.schoolSlug || 'School Admin'}
                        </h2>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    <p className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Main
                    </p>
                    <Link
                        href="/school"
                        className="flex items-center space-x-3 px-4 py-2.5 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors font-medium"
                    >
                        <LayoutDashboard size={18} />
                        <span>Dashboard</span>
                    </Link>

                    <p className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mt-4">
                        Management
                    </p>
                    <Link
                        href="/school/students"
                        className="flex items-center space-x-3 px-4 py-2.5 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors font-medium"
                    >
                        <GraduationCap size={18} />
                        <span>Students</span>
                    </Link>
                    <Link
                        href="/school/teachers"
                        className="flex items-center space-x-3 px-4 py-2.5 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors font-medium"
                    >
                        <Users size={18} />
                        <span>Teachers</span>
                    </Link>
                    <Link
                        href="/school/academics"
                        className="flex items-center space-x-3 px-4 py-2.5 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors font-medium"
                    >
                        <BookOpen size={18} />
                        <span>Academics</span>
                    </Link>

                    <p className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mt-4">
                        Configuration
                    </p>
                    <Link
                        href="/school/settings"
                        className="flex items-center space-x-3 px-4 py-2.5 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors font-medium"
                    >
                        <Settings size={18} />
                        <span>Settings</span>
                    </Link>
                </nav>

                <div className="p-4 border-t border-gray-100 bg-gray-50">
                    <div className="mb-4 px-4">
                        <p className="text-sm font-medium text-gray-900 truncate">{session.username}</p>
                        <p className="text-xs text-gray-500 truncate">{session.role}</p>
                    </div>
                    <form action={logout}>
                        <button className="flex items-center space-x-3 px-4 py-2 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg w-full transition-colors font-medium text-sm">
                            <LogOut size={18} />
                            <span>Sign out</span>
                        </button>
                    </form>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 p-8">
                {children}
            </main>
        </div>
    );
}
