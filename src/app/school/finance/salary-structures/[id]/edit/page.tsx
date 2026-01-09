// src/app/school/finance/salary-structures/[id]/edit/page.tsx
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SalaryStructureForm from '@/components/finance/SalaryStructureForm';
import { getSalaryStructureById } from '@/actions/finance';

export const runtime = 'nodejs';

interface EditSalaryStructurePageProps {
    params: { id: string };
}

export default async function EditSalaryStructurePage({ params }: EditSalaryStructurePageProps) {
    const session = await getSession();

    if (!session?.schoolId || session.role !== 'SchoolAdmin') { // Only SchoolAdmin can manage
        redirect('/login'); // Redirect unauthorized users
    }

    const salaryStructure = await getSalaryStructureById(params.id);

    if (!salaryStructure) {
        redirect('/school/finance/salary-structures'); // Redirect if not found
    }

    // Convert Decimal types to number for form defaultValues
    const defaultValues = {
        name: salaryStructure.name,
        baseSalary: Number(salaryStructure.baseSalary),
        allowances: Number(salaryStructure.allowances),
        deductions: Number(salaryStructure.deductions),
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Edit Salary Structure</h1>

            <Card className="bg-white border-gray-200 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-gray-900">Structure Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <SalaryStructureForm id={salaryStructure.id} defaultValues={defaultValues} />
                </CardContent>
            </Card>
        </div>
    );
}
