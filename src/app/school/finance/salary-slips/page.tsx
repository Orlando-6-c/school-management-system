import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { getSalarySlips } from '@/actions/finance';
import SalarySlipsClient from '@/components/finance/SalarySlipsClient';

export const dynamic = 'force-dynamic';

export default async function SalarySlipsPage() {
    const session = await getSession();
    if (!session?.schoolId || !(session.role === 'SchoolAdmin' || session.role === 'Finance' || session.isSuperAdmin)) {
        redirect('/login');
    }

    const slips = await getSalarySlips();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-foreground">Salary Slips</h1>
                <p className="text-sm text-muted-foreground mt-0.5">Generate monthly salary slips and mark them as paid.</p>
            </div>
            <SalarySlipsClient slips={slips} />
        </div>
    );
}
