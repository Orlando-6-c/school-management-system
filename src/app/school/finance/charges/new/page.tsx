import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import AdditionalChargeForm from '@/components/finance/AdditionalChargeForm';
import { getStudents } from '@/actions/student';
import { getClasses } from '@/actions/academics';

export const dynamic = 'force-dynamic';

export default async function NewAdditionalChargePage() {
    const session = await getSession();
    if (!session?.schoolId || !(session.role === 'SchoolAdmin' || session.role === 'Finance' || session.isSuperAdmin)) {
        redirect('/login');
    }

    const [students, classes] = await Promise.all([getStudents(session.schoolId), getClasses()]);

    return (
        <div className="space-y-6">
            <div>
                <Link href="/school/finance/charges" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3">
                    <ChevronLeft className="h-3.5 w-3.5" />Back to Charges
                </Link>
                <h1 className="text-2xl font-semibold text-foreground">Add Additional Charge</h1>
            </div>
            <AdditionalChargeForm
                students={students.map(s => ({ id: s.id, name: s.name, rollNumber: s.rollNumber, classId: s.classId ?? null }))}
                classes={classes.map(c => ({ id: c.id, name: c.name, section: c.section ?? null }))}
            />
        </div>
    );
}
