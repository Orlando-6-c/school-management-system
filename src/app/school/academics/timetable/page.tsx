import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import db from '@/lib/db';
import TimetableBuilder from '@/components/school/TimetableBuilder';
import { serializeData } from '@/lib/utils';

export default async function TimetablePage() {
    const session = await getSession();
    if (!session.schoolId || session.role !== 'SchoolAdmin') redirect('/login');

    const classes = await db.class.findMany({
        where: { schoolId: session.schoolId, isActive: true },
        orderBy: { gradeLevel: 'asc' }
    });

    const teachers = await db.teacher.findMany({
        where: { schoolId: session.schoolId },
        orderBy: { firstName: 'asc' }
    });

    const timetables = await db.timetable.findMany({
        where: { schoolId: session.schoolId },
        include: { teacher: true }
    });

    return (
        <div className="p-8 space-y-6">
            <div className="print:hidden">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Timetable Builder</h1>
                <p className="text-muted-foreground mt-2">Design exactly when specific subjects are taught across the week per class.</p>
            </div>

            <TimetableBuilder
                classes={serializeData(classes)}
                teachers={serializeData(teachers)}
                timetables={serializeData(timetables)}
            />
        </div>
    );
}
