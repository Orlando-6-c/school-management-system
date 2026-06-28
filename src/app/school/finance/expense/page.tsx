import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getExpenseRecords } from '@/actions/finance';
import ExpenseTable from '@/components/finance/ExpenseTable';

export const dynamic = 'force-dynamic';

export default async function ExpensePage() {
    const session = await getSession();
    if (!session?.schoolId || !(session.role === 'SchoolAdmin' || session.role === 'Finance' || session.isSuperAdmin)) {
        redirect('/login');
    }

    const expenseRecords = await getExpenseRecords();

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Expenses</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">{expenseRecords.length} records total</p>
                </div>
                <Link href="/school/finance/expense/new">
                    <Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Add Expense</Button>
                </Link>
            </div>
            <ExpenseTable expenseRecords={expenseRecords} />
        </div>
    );
}
