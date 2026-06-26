import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import db from '@/lib/db';
import { hasPermission } from '@/lib/authz';
import { format } from 'date-fns';
import { AttendanceViewer } from '@/components/school/AttendanceViewer';
import AttendanceTaker from '@/components/school/AttendanceTaker';
import { serializeData } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const runtime = 'nodejs';

export default async function AttendancePage() {
    const session = await getSession();
    if (!session.schoolId) redirect('/login');
    if (!(await hasPermission('attendance', 'view'))) redirect('/school');

    const canMark = await hasPermission('attendance', 'create');

    const classes = await db.class.findMany({
        where: { schoolId: session.schoolId!, isActive: true },
        orderBy: [{ gradeLevel: 'asc' }, { section: 'asc' }],
        select: { id: true, name: true, section: true, gradeLevel: true },
    });

    // Pre-load marking data only if user has create permission
    let uniqueAssignments: { classId: string; class: (typeof classes)[0] }[] = [];
    let classStudents: Record<string, { id: string; name: string; rollNumber: string; classId: string }[]> = {};
    let existingAttendance: Record<string, unknown[]> = {};

    if (canMark) {
        uniqueAssignments = classes.map((c) => ({ classId: c.id, class: c }));

        const studentsRaw = await db.student.findMany({
            where: { schoolId: session.schoolId!, isActive: true },
            select: { id: true, name: true, rollNumber: true, classId: true },
            orderBy: [{ class: { gradeLevel: 'asc' } }, { rollNumber: 'asc' }],
        });

        studentsRaw.forEach((s) => {
            if (!classStudents[s.classId]) classStudents[s.classId] = [];
            classStudents[s.classId].push(s);
        });

        const pastWeek = new Date();
        pastWeek.setDate(pastWeek.getDate() - 7);

        const recent = await db.attendance.findMany({
            where: {
                schoolId: session.schoolId!,
                classId: { in: classes.map((c) => c.id) },
                date: { gte: pastWeek },
            },
        });

        recent.forEach((a) => {
            const key = `${a.classId}-${format(a.date, 'yyyy-MM-dd')}`;
            if (!existingAttendance[key]) existingAttendance[key] = [];
            existingAttendance[key].push(a);
        });
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Attendance</h1>
                <p className="text-muted-foreground mt-1">
                    {canMark ? 'Mark daily attendance and review records.' : 'View daily attendance records and student summaries.'}
                </p>
            </div>

            {canMark ? (
                <Tabs defaultValue="mark">
                    <TabsList>
                        <TabsTrigger value="mark">Mark Attendance</TabsTrigger>
                        <TabsTrigger value="view">View / Reports</TabsTrigger>
                    </TabsList>
                    <TabsContent value="mark" className="pt-4">
                        <AttendanceTaker
                            assignments={serializeData(uniqueAssignments)}
                            classStudents={serializeData(classStudents)}
                            existingAttendance={serializeData(existingAttendance)}
                        />
                    </TabsContent>
                    <TabsContent value="view" className="pt-4">
                        <AttendanceViewer classes={classes} />
                    </TabsContent>
                </Tabs>
            ) : (
                <AttendanceViewer classes={classes} />
            )}
        </div>
    );
}
