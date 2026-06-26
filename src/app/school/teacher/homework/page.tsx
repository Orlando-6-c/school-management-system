import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import db from '@/lib/db';
import HomeworkManager from '@/components/school/HomeworkManager';
import { serializeData } from '@/lib/utils';

export default async function TeacherHomeworkPage() {
    const session = await getSession();
    if (!session.schoolId || session.role !== 'Teacher') redirect('/login');

    const user = await db.user.findFirst({
        where: { id: session.userId! }
    });

    if (!user || !user.teacherId) return <div className="p-8 text-destructive">Teacher profile mapping explicitly required.</div>;

    const assignments = await db.teacherClassAssignment.findMany({
        where: { teacherId: user.teacherId },
        include: { class: true }
    });

    const homeworks = await db.homework.findMany({
        where: { teacherId: user.teacherId },
        include: { class: true },
        orderBy: { dueDate: 'asc' }
    });

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Homework & Tasks</h1>
            <p className="text-muted-foreground mt-2 mb-8">Author structured homework assignments for your classes.</p>

            <HomeworkManager
                assignments={serializeData(assignments)}
                homeworks={serializeData(homeworks)}
            />
        </div>
    );
}
