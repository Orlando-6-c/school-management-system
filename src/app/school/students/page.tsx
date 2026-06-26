import { getSession } from '@/lib/session';
import db from '@/lib/db';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import PrintDirectoryButton from '@/components/school/PrintDirectoryButton';
import { StudentTable } from '@/components/school/StudentTable'; // Import the new component
import { serializeData } from '@/lib/utils';

export const runtime = 'nodejs';

export default async function StudentsPage() {
    const session = await getSession();

    // 1. Fetch Students
    const students = await db.student.findMany({
        where: { schoolId: session.schoolId!, isActive: true }, // Filter only active students
        include: {
            class: true,
            guardian: true,
        },
        orderBy: { createdAt: 'desc' },
    });

    // 2. Fetch Classes for Filter
    const classes = await db.class.findMany({
        where: { schoolId: session.schoolId!, isActive: true },
        orderBy: { gradeLevel: 'asc' }
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Student Directory</h1>
                <div className="flex gap-2">
                    <PrintDirectoryButton classes={serializeData(classes)} />
                    <Link href="/school/students/new">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            New Admission
                        </Button>
                    </Link>
                </div>
            </div>

            <Card className="bg-card border-border shadow-sm print:shadow-none print:border-none">
                <CardHeader className="print:hidden">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-foreground">Enrolled Students</CardTitle>
                            <CardDescription>
                                Total Students: {students.length}
                            </CardDescription>
                        </div>
                        <div className="relative w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name, roll no..."
                                className="pl-8 bg-card border-input"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="print:p-0">
                    <StudentTable students={serializeData(students)} session={serializeData(session)} classes={serializeData(classes)} />
                </CardContent>
            </Card>
        </div>
    );
}