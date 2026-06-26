import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import db from '@/lib/db';
import MaterialManager from '@/components/school/MaterialManager';
import { serializeData } from '@/lib/utils';

export default async function TeacherMaterialsPage() {
    const session = await getSession();
    if (!session.schoolId || session.role !== 'Teacher') redirect('/login');

    const user = await db.user.findFirst({
        where: { id: session.userId! }
    });

    if (!user || !user.teacherId) return <div className="p-8 text-destructive">Teacher profile missing.</div>;

    const assignments = await db.teacherClassAssignment.findMany({
        where: { teacherId: user.teacherId },
        include: { class: true }
    });

    const materials = await db.studyMaterial.findMany({
        where: { teacherId: user.teacherId },
        include: { class: true },
        orderBy: { createdAt: 'desc' }
    });

    // Remove duplicates from dropdown rendering
    const uniqueAssignments = Array.from(new Map(assignments.map(item => [`${item.classId}-${item.subject}`, item])).values());

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Study Materials</h1>
            <p className="text-muted-foreground mt-2 mb-8">Upload E-Books, links, and learning references exclusively for your students.</p>

            <MaterialManager
                assignments={serializeData(uniqueAssignments)}
                materials={serializeData(materials)}
            />
        </div>
    );
}
