'use server';

import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import FinanceNav from '@/components/finance/FinanceNav';

export default async function FinanceLayout({ children }: { children: React.ReactNode }) {
    const session = await getSession();
    if (
        !session.userId ||
        !session.schoolId ||
        !(session.role === 'SchoolAdmin' || session.role === 'Finance' || session.isSuperAdmin)
    ) {
        redirect('/login');
    }

    return (
        <div className="space-y-0">
            <FinanceNav />
            <div className="p-6 md:p-8">{children}</div>
        </div>
    );
}
