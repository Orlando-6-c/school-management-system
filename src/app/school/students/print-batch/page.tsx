import { redirect } from 'next/navigation';
import db from '@/lib/db';
import { getSession } from '@/lib/session';
import StudentPrintTemplate from '@/components/school/StudentPrintTemplate';
import AutoPrint from '../[id]/print/auto-print'; // Reuse existing component

export default async function BatchPrintPage({ searchParams }: { searchParams: { classId?: string } }) {
    const session = await getSession();
    if (!session.schoolId) redirect('/login');

    const { classId } = searchParams;

    const whereClause: any = {
        schoolId: session.schoolId
    };

    if (classId) {
        whereClause.classId = classId;
    }

    const students = await db.student.findMany({
        where: whereClause,
        include: {
            guardian: true,
            class: true,
            school: true
        },
        orderBy: [
            { class: { gradeLevel: 'asc' } },
            { name: 'asc' }
        ]
    });

    return (
        <div className="bg-card min-h-screen">
            <AutoPrint />
            <div className="print:hidden p-4 text-center bg-secondary border-b">
                <p className="text-sm text-muted-foreground">
                    Printing {students.length} student records.
                    {classId ? ' Filtered by Class.' : ' All Classes.'}
                </p>
            </div>

            {students.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                    No students found matching your criteria.
                </div>
            ) : (
                students.map((student: any) => (
                    <div key={student.id} style={{ pageBreakAfter: 'always' }}>
                        <StudentPrintTemplate student={student} />
                    </div>
                ))
            )}
        </div>
    );
}
