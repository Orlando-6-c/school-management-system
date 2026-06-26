// src/app/school/finance/salary-slips/generate/page.tsx
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import GenerateSalarySlipsForm from '@/components/finance/GenerateSalarySlipsForm';
import { getTeachersForFinance, getStaffForFinance, getExecutivesForFinance } from '@/actions/finance';

export const runtime = 'nodejs';

export default async function GenerateSalarySlipsPage() {
    const session = await getSession();

    if (!session?.schoolId || !(session.role === 'SchoolAdmin' || session.role === 'Finance' || session.isSuperAdmin)) {
        redirect('/login'); // Redirect unauthorized users
    }

    const teachers = await getTeachersForFinance();
    const staff = await getStaffForFinance();
    const executives = await getExecutivesForFinance();

    // Combine all employees into a single array, adding employeeType
    const allEmployees = [
        ...teachers.map((t: { id: string; firstName: string; lastName: string; salaryStructureId: string | null }) => ({
            id: t.id,
            name: `${t.firstName} ${t.lastName}`,
            type: 'Teacher' as const,
            hasSalaryStructure: !!t.salaryStructureId,
        })),
        ...staff.map((s: { id: string; name: string; salaryStructureId: string | null }) => ({
            id: s.id,
            name: s.name,
            type: 'Staff' as const,
            hasSalaryStructure: !!s.salaryStructureId,
        })),
        ...executives.map((e: { id: string; name: string; salaryStructureId: string | null }) => ({
            id: e.id,
            name: e.name,
            type: 'Executive' as const,
            hasSalaryStructure: !!e.salaryStructureId,
        })),
    ];

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Generate Salary Slips</h1>

            <Card className="bg-card border-border shadow-sm">
                <CardHeader>
                    <CardTitle className="text-foreground">Select Employees and Generate</CardTitle>
                </CardHeader>
                <CardContent>
                    <GenerateSalarySlipsForm employees={allEmployees} />
                </CardContent>
            </Card>
        </div>
    );
}
