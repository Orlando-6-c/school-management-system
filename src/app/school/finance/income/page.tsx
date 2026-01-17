// src/app/school/finance/income/page.tsx
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getIncomeRecords } from '@/actions/finance';
import IncomeTable from '@/components/finance/IncomeTable'; // To be created

export const runtime = 'nodejs';

export default async function IncomePage() {
    const session = await getSession();

    if (!session?.schoolId || !(session.role === 'SchoolAdmin' || session.role === 'Finance' || session.isSuperAdmin)) {
        redirect('/login'); // Redirect unauthorized users
    }

    const incomeRecords = await getIncomeRecords();

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Income Management</h1>
                <Link href="/school/finance/income/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Income
                    </Button>
                </Link>
            </div>

            <Card className="bg-white border-gray-200 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-gray-900">All Income Records</CardTitle>
                    <CardDescription>
                        Total Income Records: {incomeRecords.length}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <IncomeTable incomeRecords={incomeRecords} />
                </CardContent>
            </Card>
        </div>
    );
}
