import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { hasPermission } from '@/lib/authz';
import db from '@/lib/db';
import { DefaultersReport } from '@/components/school/reports/DefaultersReport';

export const runtime = 'nodejs';

export default async function DefaultersPage() {
    const session = await getSession();
    if (!session.schoolId) redirect('/login');
    if (!(await hasPermission('reports', 'view'))) redirect('/school/reports');

    const classes = await db.class.findMany({
        where: { schoolId: session.schoolId, isActive: true },
        orderBy: [{ gradeLevel: 'asc' }, { section: 'asc' }],
        select: { id: true, name: true, section: true },
    });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Defaulters</h1>
                <p className="text-muted-foreground mt-1">Students with unpaid fee challans past their due date.</p>
            </div>
            <DefaultersReport classes={classes} />
        </div>
    );
}
