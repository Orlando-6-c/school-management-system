// src/app/school/finance/income/new/page.tsx
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import IncomeForm from '@/components/finance/IncomeForm';
import { getStudents } from '@/actions/student';

export const runtime = 'nodejs';

export default async function NewIncomePage() {
    const session = await getSession();

    if (!session?.schoolId || !(session.role === 'SchoolAdmin' || session.role === 'Finance')) {
        redirect('/login'); // Redirect unauthorized users
    }

    const students = await getStudents(session.schoolId);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Add New Income</h1>

            <Card className="bg-white border-gray-200 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-gray-900">Income Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <IncomeForm students={students.map(s => ({ id: s.id, name: s.name, rollNumber: s.rollNumber }))} />
                </CardContent>
            </Card>
        </div>
    );
}
