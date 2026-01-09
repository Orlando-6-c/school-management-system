// src/app/school/finance/salary-structures/page.tsx
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getSalaryStructures } from '@/actions/finance';
import SalaryStructureTable from '@/components/finance/SalaryStructureTable'; // To be created

export const runtime = 'nodejs';

export default async function SalaryStructuresPage() {
    const session = await getSession();

    if (!session?.schoolId || session.role !== 'SchoolAdmin') { // Only SchoolAdmin can manage
        redirect('/login'); // Redirect unauthorized users
    }

    const salaryStructures = await getSalaryStructures();

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Salary Structures</h1>
                <Link href="/school/finance/salary-structures/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add New Structure
                    </Button>
                </Link>
            </div>

            <Card className="bg-white border-gray-200 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-gray-900">All Salary Structures</CardTitle>
                    <CardDescription>
                        Total Salary Structures: {salaryStructures.length}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <SalaryStructureTable salaryStructures={salaryStructures} />
                </CardContent>
            </Card>
        </div>
    );
}
