import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import db from '@/lib/db';
import { Users } from 'lucide-react';
import { ParentChildTabs } from '@/components/portal/ParentChildTabs';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default async function ParentPortalPage() {
    const session = await getSession();
    if (!session.schoolId || session.role !== 'Parent') redirect('/login');

    const user: any = await (db as any).user.findUnique({
        where: { id: session.userId! },
        include: { guardian: { include: { students: { include: { class: true } } } } }
    });

    if (!user || !user.guardian) return <div className="p-8 text-destructive">Parent/Guardian profile mapping explicitly missing.</div>;

    const children = user.guardian.students;
    if (children.length === 0) return <div className="p-8 text-destructive">No active children currently assigned to this account.</div>;

    // We process all aggregations per child efficiently
    const studentData: Record<string, any> = {};
    const bankAccounts = await (db as any).bankAccount.findMany({ where: { schoolId: session.schoolId } });

    for (const child of children) {
        if (!child.classId) continue;

        const [timetables, homeworks, materials, totalAttendance, presentCount, attendancesList, examResults, feeChallans] = await Promise.all([
            (db as any).timetable.findMany({ where: { classId: child.classId }, include: { teacher: true }, orderBy: { startTime: 'asc' } }),
            (db as any).homework.findMany({ where: { classId: child.classId }, include: { teacher: true }, orderBy: { dueDate: 'asc' } }),
            (db as any).studyMaterial.findMany({ where: { OR: [{ classId: child.classId }, { classId: null }], schoolId: session.schoolId }, include: { teacher: true }, orderBy: { createdAt: 'desc' }, take: 15 }),
            (db as any).attendance.count({ where: { studentId: child.id } }),
            (db as any).attendance.count({ where: { studentId: child.id, isPresent: true } }),
            (db as any).attendance.findMany({ where: { studentId: child.id }, orderBy: { date: 'desc' }, take: 30 }),
            (db as any).examResult.findMany({ where: { studentId: child.id }, include: { exam: true }, orderBy: { createdAt: 'desc' } }),
            (db as any).feeChallan.findMany({ where: { studentId: child.id }, orderBy: { dueDate: 'desc' } })
        ]);

        studentData[child.id] = {
            timetables,
            homeworks,
            materials,
            attendancePercentage: totalAttendance === 0 ? 100 : Math.round((presentCount / totalAttendance) * 100),
            attendancesList,
            examResults,
            feeChallans,
            bankAccounts
        };
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-12">
            <header className="bg-white p-8 rounded-2xl border border-border shadow-sm">
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3"><Users className="text-indigo-600" /> Parent Portal: {user.guardian.name}</h1>
                <p className="text-muted-foreground mt-2">Overseeing {children.length} enrolled {children.length === 1 ? 'child' : 'children'}.</p>
            </header>

            <div className="space-y-16">
                {children.map((child: any) => {
                    const data = studentData[child.id];
                    if (!data) return null;

                    return (
                        <ParentChildTabs
                            key={child.id}
                            data={data}
                            childName={child.name}
                            childClass={child.class.name}
                            childSection={child.class.section}
                            childRollNumber={child.rollNumber}
                        />
                    );
                })}
            </div>
        </div>
    );
}
