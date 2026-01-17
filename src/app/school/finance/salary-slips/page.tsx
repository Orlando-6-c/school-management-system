// src/app/school/finance/salary-slips/page.tsx
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getSalarySlips } from '@/actions/finance';
import SalarySlipTable from '@/components/finance/SalarySlipTable'; // To be created

export const runtime = 'nodejs';

export default async function SalarySlipsPage() {
    const session = await getSession();

    if (!session?.schoolId || !(session.role === 'SchoolAdmin' || session.role === 'Finance' || session.isSuperAdmin)) {
        redirect('/login'); // Redirect unauthorized users
    }

    const salarySlips = await getSalarySlips();

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Salary Slips</h1>
                <Link href="/school/finance/salary-slips/generate">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Generate Slips
                    </Button>
                </Link>
            </div>

            <Card className="bg-white border-gray-200 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-gray-900">All Salary Slips</CardTitle>
                    <CardDescription>
                        Total Salary Slips: {salarySlips.length}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <SalarySlipTable salarySlips={salarySlips} />
                </CardContent>
            </Card>
        </div>
    );
}
