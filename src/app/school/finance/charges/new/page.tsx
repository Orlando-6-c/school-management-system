// src/app/school/finance/charges/new/page.tsx
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AdditionalChargeForm from '@/components/finance/AdditionalChargeForm';
import { getStudents } from '@/actions/student';
import { getClasses } from '@/actions/academics';

export const runtime = 'nodejs';

export default async function NewAdditionalChargePage() {
    const session = await getSession();

    if (!session?.schoolId || !(session.role === 'SchoolAdmin' || session.role === 'Finance')) {
        redirect('/login'); // Redirect unauthorized users
    }

    const students = await getStudents(session.schoolId);
    const classes = await getClasses(session.schoolId);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Add New Additional Charge</h1>

            <Card className="bg-white border-gray-200 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-gray-900">Charge Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <AdditionalChargeForm 
                        students={students.map(s => ({ id: s.id, name: s.name, rollNumber: s.rollNumber }))}
                        classes={classes.map(c => ({ id: c.id, name: c.name, section: c.section }))}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
