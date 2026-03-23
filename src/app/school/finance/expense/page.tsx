// src/app/school/finance/expense/page.tsx
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getExpenseRecords } from '@/actions/finance';
import ExpenseTable from '@/components/finance/ExpenseTable'; // To be created

export const runtime = 'nodejs';

export default async function ExpensePage() {
    const session = await getSession();

    if (!session?.schoolId || !(session.role === 'SchoolAdmin' || session.role === 'Finance' || session.isSuperAdmin)) {
        redirect('/login'); // Redirect unauthorized users
    }

    const expenseRecords = await getExpenseRecords();

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Expense Management</h1>
                <Link href="/school/finance/expense/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Expense
                    </Button>
                </Link>
            </div>

            <Card className="bg-card border-border shadow-sm">
                <CardHeader>
                    <CardTitle className="text-foreground">All Expense Records</CardTitle>
                    <CardDescription>
                        Total Expense Records: {expenseRecords.length}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ExpenseTable expenseRecords={expenseRecords} />
                </CardContent>
            </Card>
        </div>
    );
}