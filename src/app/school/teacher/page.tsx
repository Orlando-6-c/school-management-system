import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import db from '@/lib/db';
import Link from 'next/link';

export default async function TeacherDashboardPage() {
    const session = await getSession();
    if (!session.schoolId || session.role !== 'Teacher') redirect('/login');

    const user = await db.user.findFirst({
        where: { id: session.userId! },
        include: { teacher: true }
    });

    if (!user || !user.teacher) {
        return <div className="p-8">Error: Teacher Profile not explicitly linked. Contact Administration.</div>;
    }

    const assignments = await db.teacherClassAssignment.findMany({
        where: { teacherId: user.teacher.id },
        include: { class: true }
    });

    return (
        <div className="p-8 space-y-8 max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold tracking-tight">Welcome, {user.teacher.firstName}!</h1>
            <p className="text-muted-foreground text-lg">You are currently assigned to {assignments.length} unique subject-classes.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <Link href="/school/teacher/attendance" className="block p-6 bg-card border border-border shadow-sm rounded-xl hover:shadow-md transition-shadow">
                    <h2 className="text-xl font-bold text-violet-600">Daily Attendance</h2>
                    <p className="mt-2 text-sm text-muted-foreground">Mark your assigned students present or absent easily.</p>
                </Link>

                <Link href="/school/teacher/homework" className="block p-6 bg-card border border-border shadow-sm rounded-xl hover:shadow-md transition-shadow">
                    <h2 className="text-xl font-bold text-emerald-600">Homework & Tasks</h2>
                    <p className="mt-2 text-sm text-muted-foreground">Author structured assignments, track due dates.</p>
                </Link>

                <Link href="/school/teacher/materials" className="block p-6 bg-card border border-border shadow-sm rounded-xl hover:shadow-md transition-shadow">
                    <h2 className="text-xl font-bold text-amber-600">E-Books & Materials</h2>
                    <p className="mt-2 text-sm text-muted-foreground">Upload and share study attachments strictly via file links.</p>
                </Link>
            </div>
        </div>
    );
}
