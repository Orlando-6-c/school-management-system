// src/app/school/finance/salary-structures/new/page.tsx
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SalaryStructureForm from '@/components/finance/SalaryStructureForm';

export const runtime = 'nodejs';

export default async function NewSalaryStructurePage() {
    const session = await getSession();

    if (!session?.schoolId || session.role !== 'SchoolAdmin') { // Only SchoolAdmin can manage
        redirect('/login'); // Redirect unauthorized users
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Add New Salary Structure</h1>

            <Card className="bg-white border-gray-200 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-gray-900">Structure Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <SalaryStructureForm />
                </CardContent>
            </Card>
        </div>
    );
}
