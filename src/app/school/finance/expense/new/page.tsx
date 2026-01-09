// src/app/school/finance/expense/new/page.tsx
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ExpenseForm from '@/components/finance/ExpenseForm';

export const runtime = 'nodejs';

export default async function NewExpensePage() {
    const session = await getSession();

    if (!session?.schoolId || !(session.role === 'SchoolAdmin' || session.role === 'Finance')) {
        redirect('/login'); // Redirect unauthorized users
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Add New Expense</h1>

            <Card className="bg-white border-gray-200 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-gray-900">Expense Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <ExpenseForm />
                </CardContent>
            </Card>
        </div>
    );
}
