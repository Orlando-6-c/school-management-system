import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { hasPermission } from '@/lib/authz';
import { IncomeExpenseReport } from '@/components/school/reports/IncomeExpenseReport';

export const runtime = 'nodejs';

export default async function IncomeExpensePage() {
    const session = await getSession();
    if (!session.schoolId) redirect('/login');
    if (!(await hasPermission('reports', 'view'))) redirect('/school/reports');

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Income vs Expense</h1>
                <p className="text-muted-foreground mt-1">Yearly breakdown of income and expenses by month and category.</p>
            </div>
            <IncomeExpenseReport />
        </div>
    );
}
