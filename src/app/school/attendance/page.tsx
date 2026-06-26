import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import db from '@/lib/db';
import { hasPermission } from '@/lib/authz';
import { AttendanceViewer } from '@/components/school/AttendanceViewer';

export const runtime = 'nodejs';

export default async function AttendancePage() {
    const session = await getSession();
    if (!session.schoolId) redirect('/login');
    if (!(await hasPermission('attendance', 'view'))) redirect('/school');

    const classes = await db.class.findMany({
        where: { schoolId: session.schoolId, isActive: true },
        orderBy: [{ gradeLevel: 'asc' }, { section: 'asc' }],
        select: { id: true, name: true, section: true, gradeLevel: true },
    });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Attendance</h1>
                <p className="text-muted-foreground mt-1">View daily attendance records and student summaries.</p>
            </div>
            <AttendanceViewer classes={classes} />
        </div>
    );
}
