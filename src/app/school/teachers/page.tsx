import Link from 'next/link';
import { getSession } from '@/lib/session';
import db from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { TeacherTable } from '@/components/school/TeacherTable'; // Import the new component
import { serializeData } from '@/lib/utils';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

export const runtime = 'nodejs';

export default async function TeachersPage() {
    const session = await getSession();
    if (!session.schoolId) return null; // Or redirect

    const teachers = await db.teacher.findMany({
        where: { schoolId: session.schoolId, isActive: true }, // Filter only active teachers
        orderBy: { firstName: 'asc' }
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center print:hidden">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Teachers Directory</h1>
                <div className="flex gap-2">
                    {/* <Button variant="outline" disabled>
                        <Printer className="mr-2 h-4 w-4" />
                        Print
                    </Button> */}
                    <Link href="/school/teachers/new">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Teacher
                        </Button>
                    </Link>
                </div>
            </div>

            <Card className="bg-card border-border shadow-sm print:shadow-none print:border-none">
                <CardHeader className="print:hidden">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-foreground">Registered Teachers</CardTitle>
                            <CardDescription>
                                Total Teachers: {teachers.length}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="print:p-0">
                    <TeacherTable teachers={serializeData(teachers)} session={serializeData(session)} />
                </CardContent>
            </Card>
        </div>
    );
}