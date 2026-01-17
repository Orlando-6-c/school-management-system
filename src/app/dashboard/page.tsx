import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { logout } from '@/actions/auth';

export const runtime = 'nodejs';

export default async function DashboardPage() {
    const session = await getSession();

    if (!session.userId) {
        redirect('/login');
    }

    if (session.isSuperAdmin) {
        redirect('/admin');
    }

    if (session.role === 'SchoolAdmin' || session.role === 'Finance') {
        redirect('/school');
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                        <p className="text-gray-600 mt-2">
                            Welcome back, {session.username} ({session.schoolSlug})
                        </p>
                    </div>
                    <form action={logout}>
                        <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition">
                            Logout
                        </button>
                    </form>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Under Construction</h2>
                    <p className="text-gray-500">
                        The School Management Dashboard is being set up. Check back soon!
                    </p>
                </div>
            </div>
        </div>
    );
}
