import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import db from '@/lib/db';
import TeacherAssignmentForm from '@/components/school/TeacherAssignmentForm';
import { serializeData } from '@/lib/utils';

export default async function AssignmentsPage() {
    const session = await getSession();
    if (!session.schoolId || session.role !== 'SchoolAdmin') redirect('/login');

    const teachers = await db.teacher.findMany({
        where: { schoolId: session.schoolId, isActive: true },
        orderBy: { firstName: 'asc' }
    });

    const classes = await db.class.findMany({
        where: { schoolId: session.schoolId, isActive: true },
        orderBy: { gradeLevel: 'asc' }
    });

    const assignments = await db.teacherClassAssignment.findMany({
        where: { class: { schoolId: session.schoolId } },
        include: { teacher: true, class: true },
        orderBy: { createdAt: 'desc' }
    });

    return (
        <div className="p-8 space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Teacher Assignments</h1>
                <p className="text-muted-foreground mt-2">Assign academic classes and subjects to your active teaching staff.</p>
            </div>

            <TeacherAssignmentForm
                teachers={serializeData(teachers)}
                classes={serializeData(classes)}
                assignments={serializeData(assignments)}
            />
        </div>
    );
}
