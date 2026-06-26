import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { hasPermission } from '@/lib/authz';
import { getStaffById } from '@/actions/staff';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StaffForm } from '@/components/school/StaffForm';

export const runtime = 'nodejs';

export default async function EditStaffPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getSession();
    if (!session.schoolId) redirect('/login');
    if (!(await hasPermission('staff', 'edit'))) redirect('/school/staff');

    const staff = await getStaffById(id);
    if (!staff) redirect('/school/staff');

    return (
        <div className="max-w-2xl space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Edit Staff</h1>
                <p className="text-muted-foreground mt-1">{staff.name}</p>
            </div>
            <Card className="border-border shadow-sm">
                <CardHeader><CardTitle>Staff Details</CardTitle></CardHeader>
                <CardContent>
                    <StaffForm
                        staffId={id}
                        defaultValues={{
                            name: staff.name,
                            fatherName: staff.fatherName,
                            cnic: staff.cnic,
                            dateOfBirth: staff.dateOfBirth.toISOString().split('T')[0],
                            contact: staff.contact,
                            gender: staff.gender as 'Male' | 'Female',
                            role: staff.role,
                            workingHours: staff.workingHours,
                            photograph: staff.photograph ?? '',
                        }}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
