import { getSession } from '@/lib/session';
import db from '@/lib/db';
import { AdmissionForm } from '@/components/school/AdmissionForm';

export const runtime = 'nodejs';

export default async function AdmissionPage() {
    const session = await getSession();

    // Fetch available classes for the dropdown
    const classes = await db.class.findMany({
        where: { schoolId: session.schoolId! },
        select: { id: true, name: true, section: true },
        orderBy: { gradeLevel: 'asc' }
    });

    return (
        <div className="max-w-5xl mx-auto py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">New Admission</h1>
                <p className="text-gray-500 mt-2">
                    Admit a new student or add a sibling.
                </p>
            </div>

            <AdmissionForm classes={classes} />
        </div>
    );
}
