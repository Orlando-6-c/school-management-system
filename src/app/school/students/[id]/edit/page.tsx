import { notFound, redirect } from 'next/navigation';
import db from '@/lib/db';
import { getSession } from '@/lib/session';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; // Assuming standard Shadcn/UI input
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { updateStudent } from '@/actions/student'; // Import the action

// We need to create a client component wrapper for the form logic to use useActionState (or useFormState)
import EditStudentForm from './edit-form';
import { AccountSettings } from '@/components/school/AccountSettings';

export default async function EditStudentPage({ params }: { params: { id: string } }) {
    const session = await getSession();
    if (!session.schoolId) redirect('/login');

    const { id } = params;

    const student = await db.student.findUnique({
        where: { id, schoolId: session.schoolId },
        include: {
            guardian: true,
            class: true
        }
    });

    if (!student) notFound();

    const classes = await db.class.findMany({
        where: { schoolId: session.schoolId, isActive: true },
        orderBy: { gradeLevel: 'asc' }
    });

    const userAccount = await db.user.findFirst({
        where: { studentId: id, schoolId: session.schoolId }
    });

    return (
        <div className="container mx-auto py-10 max-w-4xl">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Edit Student</h1>
                <Button variant="outline" asChild>
                    <a href="/school/students">Cancel</a>
                </Button>
            </div>

            <EditStudentForm student={student} classes={classes} />

            <AccountSettings
                targetType="Student"
                targetId={id}
                hasAccount={!!userAccount}
                isActive={userAccount?.isActive ?? false}
                username={userAccount?.username}
            />
        </div>
    );
}
