// src/app/school/finance/salary-slips/generate/page.tsx
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import GenerateSalarySlipsForm from '@/components/finance/GenerateSalarySlipsForm';
import { getTeachersForFinance, getStaffForFinance, getExecutivesForFinance } from '@/actions/finance';

export const runtime = 'nodejs';

export default async function GenerateSalarySlipsPage() {
    const session = await getSession();

    if (!session?.schoolId || !(session.role === 'SchoolAdmin' || session.role === 'Finance')) {
        redirect('/login'); // Redirect unauthorized users
    }

    const teachers = await getTeachersForFinance();
    const staff = await getStaffForFinance();
    const executives = await getExecutivesForFinance();

    // Combine all employees into a single array, adding employeeType
    const allEmployees = [
        ...teachers.map(t => ({ 
            id: t.id, 
            name: `${t.firstName} ${t.lastName}`, 
            type: 'Teacher' as 'Teacher',
            hasSalaryStructure: !!t.salaryStructureId,
        })),
        ...staff.map(s => ({ 
            id: s.id, 
            name: s.name, 
            type: 'Staff' as 'Staff',
            hasSalaryStructure: !!s.salaryStructureId,
        })),
        ...executives.map(e => ({ 
            id: e.id, 
            name: e.name, 
            type: 'Executive' as 'Executive',
            hasSalaryStructure: !!e.salaryStructureId,
        })),
    ];

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Generate Salary Slips</h1>

            <Card className="bg-white border-gray-200 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-gray-900">Select Employees and Generate</CardTitle>
                </CardHeader>
                <CardContent>
                    <GenerateSalarySlipsForm employees={allEmployees} />
                </CardContent>
            </Card>
        </div>
    );
}
