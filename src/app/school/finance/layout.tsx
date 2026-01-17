import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';

export default async function FinanceLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getSession();

    // Check if user is authorized to access finance module
    // Allow SchoolAdmin, SuperAdmin, AND Finance role (Clerk)
    if (!session.userId || !session.schoolId || !(session.role === 'SchoolAdmin' || session.role === 'Finance' || session.isSuperAdmin)) {
        redirect('/login'); // Redirect unauthorized users
    }

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}