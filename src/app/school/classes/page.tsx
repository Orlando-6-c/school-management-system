import { getSession } from '@/lib/session';
import db from '@/lib/db';
import { CreateClassForm } from '@/components/school/CreateClassForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const runtime = 'nodejs';

export default async function ClassesPage() {
    const session = await getSession();

    // Fetch Classes
    const classes = await db.class.findMany({
        where: { schoolId: session.schoolId! },
        include: {
            _count: { select: { students: true } },
            teacherAssignments: { include: { teacher: true } }
        },
        orderBy: { gradeLevel: 'asc' }
    });

    // Fetch Teachers
    const teachers = await db.teacher.findMany({
        where: { schoolId: session.schoolId! },
        select: { id: true, name: true },
        orderBy: { name: 'asc' }
    });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Class Management</h1>
                <p className="text-muted-foreground mt-2">Create and manage your school classes and fees.</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Left Column: Create Form */}
                <div className="lg:col-span-1">
                    <CreateClassForm teachers={teachers} />
                </div>

                {/* Right Column: Class List */}
                <div className="lg:col-span-2 space-y-4">
                    {classes.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground bg-card rounded-lg border border-dashed border-input">
                            No classes found. Use the form to create one.
                        </div>
                    ) : (
                        classes.map((cls) => (
                            <Card key={cls.id} className="bg-card shadow-sm border-border">
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-foreground">{cls.name}</h3>
                                            {cls.section && (
                                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    {cls.section}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-sm text-muted-foreground mt-1">
                                            Fee: <span className="font-medium text-foreground">{Number(cls.monthlyTuitionFee)}</span> / month
                                        </div>
                                        <div className="text-xs text-gray-400 mt-1">
                                            {cls._count.students} Students • {cls.teacherAssignments[0]?.teacher.name || 'No Teacher'}
                                        </div>
                                    </div>
                                    {/* Actions could go here */}
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
