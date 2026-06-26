import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { hasPermission, getCurrentUserWithPermissions, userCan } from '@/lib/authz';
import db from '@/lib/db';
import { CreateClassForm } from '@/components/school/CreateClassForm';
import { ClassActions } from '@/components/school/ClassActions';
import { Card, CardContent } from '@/components/ui/card';
import { Users, GraduationCap } from 'lucide-react';

export const runtime = 'nodejs';

export default async function ClassesPage() {
    const session = await getSession();
    if (!session.schoolId) redirect('/login');
    if (!(await hasPermission('classes', 'view'))) redirect('/school');

    const actor = await getCurrentUserWithPermissions();
    const canCreate = actor ? userCan(actor, 'classes', 'create') : false;
    const canEdit = actor ? userCan(actor, 'classes', 'edit') : false;
    const canDelete = actor ? userCan(actor, 'classes', 'delete') : false;

    const [classes, teachers] = await Promise.all([
        db.class.findMany({
            where: { schoolId: session.schoolId!, isActive: true },
            include: {
                _count: { select: { students: true } },
                teacherAssignments: { include: { teacher: true } },
            },
            orderBy: { gradeLevel: 'asc' },
        }),
        db.teacher.findMany({
            where: { schoolId: session.schoolId!, isActive: true },
            select: { id: true, firstName: true, lastName: true },
            orderBy: { firstName: 'asc' },
        }),
    ]);

    const teacherOptions = teachers.map((t) => ({ id: t.id, name: `${t.firstName} ${t.lastName}` }));

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Class Management</h1>
                <p className="text-muted-foreground mt-2">Create and manage your school classes and fee structure.</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {canCreate && (
                    <div className="lg:col-span-1">
                        <CreateClassForm teachers={teacherOptions} />
                    </div>
                )}

                <div className={`space-y-3 ${canCreate ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
                    {classes.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground bg-card rounded-lg border border-dashed border-input">
                            No classes yet. {canCreate ? 'Use the form to create one.' : 'Contact your administrator to create classes.'}
                        </div>
                    ) : (
                        classes.map((cls) => {
                            const classTeacher = cls.teacherAssignments[0]?.teacher;
                            return (
                                <Card key={cls.id} className="bg-card shadow-sm border-border">
                                    <CardContent className="p-4 flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                                <GraduationCap className="h-5 w-5 text-indigo-600" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h3 className="font-bold text-foreground">{cls.name}</h3>
                                                    {cls.section && (
                                                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                            {cls.section}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                                                    <span className="font-medium text-foreground">
                                                        Rs {Number(cls.monthlyTuitionFee).toLocaleString()} / month
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Users className="h-3 w-3" />
                                                        {cls._count.students} student{cls._count.students !== 1 ? 's' : ''}
                                                    </span>
                                                    {classTeacher ? (
                                                        <span>{classTeacher.firstName} {classTeacher.lastName}</span>
                                                    ) : (
                                                        <span className="italic">No class teacher</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {(canEdit || canDelete) && (
                                            <ClassActions
                                                classItem={{
                                                    ...cls,
                                                    monthlyTuitionFee: Number(cls.monthlyTuitionFee),
                                                }}
                                                teachers={teacherOptions}
                                            />
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
