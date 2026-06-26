import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { hasPermission } from '@/lib/authz';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StaffForm } from '@/components/school/StaffForm';

export const runtime = 'nodejs';

export default async function NewStaffPage() {
    const session = await getSession();
    if (!session.schoolId) redirect('/login');
    if (!(await hasPermission('staff', 'create'))) redirect('/school/staff');

    return (
        <div className="max-w-2xl space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Add Staff Member</h1>
                <p className="text-muted-foreground mt-1">Add a new non-teaching staff member to your school.</p>
            </div>
            <Card className="border-border shadow-sm">
                <CardHeader><CardTitle>Staff Details</CardTitle></CardHeader>
                <CardContent><StaffForm /></CardContent>
            </Card>
        </div>
    );
}
