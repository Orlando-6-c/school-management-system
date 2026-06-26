import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';

export const runtime = 'nodejs';

export default async function DashboardPage() {
    const session = await getSession();

    if (!session.userId) redirect('/login');
    if (session.isSuperAdmin) redirect('/admin');

    switch (session.role) {
        case 'SchoolAdmin':
        case 'Finance':
            redirect('/school');
        case 'Teacher':
            redirect('/school/teacher');
        case 'Student':
            redirect('/portal/student');
        case 'Parent':
            redirect('/portal/parent');
        default:
            redirect('/school');
    }
}
