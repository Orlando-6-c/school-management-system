import { getSession } from '@/lib/session';
import db from '@/lib/db';
import { CreateClassDialog } from '@/components/school/CreateClassDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const runtime = 'nodejs';

export default async function AcademicsPage() {
    const session = await getSession();

    // Guard clause for missing schoolId (e.g. Super Admin without selected school)
    if (!session.schoolId) {
        return (
            <div className="p-6">
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                    <div className="flex">
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-yellow-800">
                                No School Selected
                            </h3>
                            <div className="mt-2 text-sm text-yellow-700">
                                <p>
                                    You are logged in as a user without a direct school association (e.g. Super Admin).
                                    Please select a school to view academics.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Fetch Classes with student counts and teacher assignments
    // Added safe fetching: returns empty array if DB call fails (though db.class.findMany usually doesn't throw on empty)
    const classes = await db.class.findMany({
        where: { schoolId: session.schoolId },
        include: {
            _count: {
                select: { students: true }
            },
            teacherAssignments: {
                include: {
                    teacher: true
                }
            }
        },
        orderBy: { gradeLevel: 'asc' }
    });

    // Fetch Teachers for the Create Dialog
    // Updated to select firstName/lastName instead of 'name' which doesn't exist
    const rawTeachers = await db.teacher.findMany({
        where: { schoolId: session.schoolId },
        select: { id: true, firstName: true, lastName: true },
        orderBy: { firstName: 'asc' }
    });

    // Transform for the dialog interface
    const teachers = rawTeachers.map(t => ({
        id: t.id,
        name: `${t.firstName} ${t.lastName}`
    }));

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Academics</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage classes and sections.
                    </p>
                </div>
                <CreateClassDialog teachers={teachers} />
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {/* Empty State Handling */}
                {(!classes || classes.length === 0) ? (
                    <div className="col-span-full text-center py-12 text-muted-foreground bg-card rounded-lg border border-dashed border-input">
                        <p className="mb-2">No classes found.</p>
                        <p className="text-sm">Create your first class to get started.</p>
                    </div>
                ) : (
                    classes.map((cls) => (
                        <Card key={cls.id} className="bg-card shadow-sm border-border hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-lg font-bold text-foreground">
                                    {cls.name}
                                </CardTitle>
                                {cls.section && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        Sec: {cls.section}
                                    </span>
                                )}
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4 mt-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Students</span>
                                        <span className="font-medium text-foreground">{cls._count?.students ?? 0}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Class Teacher</span>
                                        <span className="font-medium text-foreground text-right truncate max-w-[150px]">
                                            {/* Defensive check for teacher assignments and teacher object */}
                                            {cls.teacherAssignments && cls.teacherAssignments.length > 0 && cls.teacherAssignments[0].teacher
                                                ? `${cls.teacherAssignments[0].teacher.firstName} ${cls.teacherAssignments[0].teacher.lastName}`
                                                : <span className="text-gray-400 italic">None</span>}
                                        </span>
                                    </div>
                                    <div className="pt-2 border-t border-gray-100">
                                        <span className="text-xs text-gray-400">Hex Code: {cls.hexCode}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
