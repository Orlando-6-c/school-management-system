import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { getChallans } from '@/actions/finance';
import { getClasses } from '@/actions/academics';
import { getStudents } from '@/actions/student';
import ChallanList from '@/components/finance/ChallanList';

export const dynamic = 'force-dynamic';

export default async function ChallanPage() {
    const session = await getSession();
    if (!session?.schoolId || !(session.role === 'SchoolAdmin' || session.role === 'Finance' || session.isSuperAdmin)) {
        redirect('/login');
    }

    const [challans, classes, allStudents] = await Promise.all([
        getChallans(),
        getClasses(),
        getStudents(session.schoolId),
    ]);

    const classesForFilter = classes.map(c => ({ id: c.id, name: c.name, section: c.section ?? null }));
    const studentsForFilter = allStudents.map(s => ({
        id: s.id,
        name: s.name,
        rollNumber: s.rollNumber,
        classId: s.classId ?? null,
    }));

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Fee Challans</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">{challans.length} challans total</p>
                </div>
                <Link href="/school/finance/challan/generate">
                    <Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Generate Challans</Button>
                </Link>
            </div>
            <ChallanList challans={challans} classes={classesForFilter} students={studentsForFilter} />
        </div>
    );
}
