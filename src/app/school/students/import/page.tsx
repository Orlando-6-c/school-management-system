import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { hasPermission } from '@/lib/authz';
import db from '@/lib/db';
import { ImportClient } from './import-client';

export const runtime = 'nodejs';

export default async function ImportStudentsPage() {
    const session = await getSession();
    if (!session.schoolId) redirect('/login');
    if (!(await hasPermission('students', 'create'))) redirect('/school/students');

    const classes = await db.class.findMany({
        where: { schoolId: session.schoolId, isActive: true },
        select: { name: true, section: true },
        orderBy: { gradeLevel: 'asc' },
    });

    return <ImportClient classes={classes} />;
}
