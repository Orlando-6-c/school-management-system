import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import db from '@/lib/db';
import AttendanceTaker from '@/components/school/AttendanceTaker';
import { serializeData } from '@/lib/utils';
import { format } from 'date-fns';

export default async function TeacherAttendancePage() {
    const session = await getSession();
    if (!session.schoolId || session.role !== 'Teacher') redirect('/login');

    const user = await db.user.findFirst({
        where: { id: session.userId! }
    });

    if (!user || !user.teacherId) return <div className="p-8 text-destructive">Teacher profile mapping completely missing.</div>;

    // Fast-loading exclusively what concerns THIS teacher
    const assignments = await db.teacherClassAssignment.findMany({
        where: { teacherId: user.teacherId },
        include: { class: true }
    });

    // Unique classes only (they could be assigned to multiple subjects in one class)
    const uniqueClassIds = Array.from(new Set(assignments.map(a => a.classId)));

    const studentsRaw = await db.student.findMany({
        where: { classId: { in: uniqueClassIds }, schoolId: session.schoolId, isActive: true },
        select: { id: true, name: true, rollNumber: true, classId: true },
        orderBy: { name: 'asc' }
    });

    const classStudents: Record<string, any[]> = {};
    studentsRaw.forEach(s => {
        if (!classStudents[s.classId]) classStudents[s.classId] = [];
        classStudents[s.classId].push(s);
    });

    // We fetch a batch cache of attendance over the last 7 days + today to fast-hydrate UI if they swap around
    const today = new Date();
    const pastWeek = new Date(today);
    pastWeek.setDate(pastWeek.getDate() - 7);

    const historicalRaw = await db.attendance.findMany({
        where: { classId: { in: uniqueClassIds }, date: { gte: pastWeek } }
    });

    const existingAttendance: Record<string, any[]> = {};
    historicalRaw.forEach(a => {
        const dateKey = `${a.classId}-${format(a.date, 'yyyy-MM-dd')}`;
        if (!existingAttendance[dateKey]) existingAttendance[dateKey] = [];
        existingAttendance[dateKey].push(a);
    });

    // Remove strict duplication in assignment dropdown rendering (Class 10 - Math & Class 10 - Science causes two UI rows)
    const uniqueAssignments = Array.from(new Map(assignments.map(item => [item.classId, item])).values());

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Class Attendance</h1>
            <p className="text-muted-foreground mt-2 mb-8">Mark active daily attendance dynamically for your authorized classrooms.</p>

            <AttendanceTaker
                assignments={serializeData(uniqueAssignments)}
                classStudents={serializeData(classStudents)}
                existingAttendance={serializeData(existingAttendance)}
            />
        </div>
    );
}
