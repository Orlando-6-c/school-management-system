import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import db from '@/lib/db';
import { SchoolSidebar } from '@/components/school/SchoolSidebar';

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

    // Fetch User and School details
    const user = await db.user.findUnique({
        where: { id: session.userId },
        include: { school: true },
    });

    if (!user || !user.school) {
        // Handle edge case where user/school might be deleted
        redirect('/login');
    }

    return (
        <div className="min-h-screen bg-muted flex">
            {/* Sidebar */}
            <SchoolSidebar
                schoolName={user.school.name}
                schoolSlug={user.school.slug}
                userName={user.username}
                userRole={user.role}
            />

            {/* Main Content */}
            <main className="flex-1 ml-64 p-8">
                {children}
            </main>
        </div>
    );
}
