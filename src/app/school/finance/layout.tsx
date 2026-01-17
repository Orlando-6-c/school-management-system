import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';

export default async function FinanceLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getSession();

    // Check if user is authorized to access finance module
    // STRICT RULE: 'Finance' role (Clerk) is NOT allowed here. Only SchoolAdmin/SuperAdmin.
    if (!session.userId || !session.schoolId || !(session.role === 'SchoolAdmin' || session.isSuperAdmin)) {
        // If it's a clerk (Finance role) trying to access, redirect them to main dashboard
        if (session.role === 'Finance') {
            redirect('/school');
        }
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