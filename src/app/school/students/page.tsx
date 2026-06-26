import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { hasPermission } from '@/lib/authz';
import db from '@/lib/db';
import Link from 'next/link';
import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { StudentTable } from '@/components/school/StudentTable';
import { SearchBar } from '@/components/ui/search-bar';
import { PaginationControls } from '@/components/ui/pagination-controls';
import PrintDirectoryButton from '@/components/school/PrintDirectoryButton';
import { serializeData } from '@/lib/utils';

export const runtime = 'nodejs';

const PAGE_SIZE = 50;

export default async function StudentsPage({
    searchParams,
}: {
    searchParams: Promise<{ search?: string; class?: string; page?: string }>;
}) {
    const session = await getSession();
    if (!session.schoolId) redirect('/login');
    if (!(await hasPermission('students', 'view'))) redirect('/school');

    const { search, class: classFilter, page: pageStr } = await searchParams;
    const page = Math.max(1, parseInt(pageStr ?? '1', 10));
    const skip = (page - 1) * PAGE_SIZE;

    const where: Record<string, unknown> = {
        schoolId: session.schoolId,
        isActive: true,
        ...(classFilter && classFilter !== 'all' ? { classId: classFilter } : {}),
        ...(search
            ? {
                  OR: [
                      { name: { contains: search, mode: 'insensitive' } },
                      { rollNumber: { contains: search, mode: 'insensitive' } },
                  ],
              }
            : {}),
    };

    const [students, totalCount, classes] = await Promise.all([
        db.student.findMany({
            where,
            include: { class: true, guardian: true },
            orderBy: [{ class: { gradeLevel: 'asc' } }, { rollNumber: 'asc' }],
            skip,
            take: PAGE_SIZE,
        }),
        db.student.count({ where }),
        db.class.findMany({
            where: { schoolId: session.schoolId, isActive: true },
            orderBy: { gradeLevel: 'asc' },
        }),
    ]);

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Student Directory</h1>
                <div className="flex gap-2">
                    <PrintDirectoryButton classes={serializeData(classes)} />
                    <Button asChild>
                        <Link href="/school/students/new">
                            <Plus className="mr-2 h-4 w-4" />
                            New Admission
                        </Link>
                    </Button>
                </div>
            </div>

            <Card className="bg-card border-border shadow-sm print:shadow-none print:border-none">
                <CardHeader className="print:hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <CardTitle className="text-foreground">Enrolled Students</CardTitle>
                            <CardDescription>
                                {totalCount} student{totalCount !== 1 ? 's' : ''}
                                {search ? ` matching "${search}"` : ''}
                                {classFilter && classFilter !== 'all'
                                    ? ` in ${classes.find((c) => c.id === classFilter)?.name ?? 'class'}`
                                    : ''}
                            </CardDescription>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {/* Class filter — client-side nav via form */}
                            <form method="GET" className="flex gap-2">
                                {search && <input type="hidden" name="search" value={search} />}
                                <Select name="class" defaultValue={classFilter ?? 'all'}>
                                    <SelectTrigger className="w-44">
                                        <SelectValue placeholder="All classes" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All classes</SelectItem>
                                        {classes.map((c) => (
                                            <SelectItem key={c.id} value={c.id}>
                                                {c.name} {c.section ? `(${c.section})` : ''}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button type="submit" variant="outline" size="sm">Filter</Button>
                                {classFilter && classFilter !== 'all' && (
                                    <Button variant="ghost" size="sm" asChild>
                                        <Link href={`/school/students${search ? `?search=${search}` : ''}`}>Clear</Link>
                                    </Button>
                                )}
                            </form>
                            {/* Search input — live URL update */}
                            <Suspense>
                                <SearchBar placeholder="Name or roll number…" className="w-56" />
                            </Suspense>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="print:p-0 p-0">
                    <StudentTable
                        students={serializeData(students)}
                        session={serializeData(session)}
                        classes={serializeData(classes)}
                    />
                    <Suspense>
                        <PaginationControls
                            currentPage={page}
                            totalPages={totalPages}
                            totalCount={totalCount}
                            pageSize={PAGE_SIZE}
                        />
                    </Suspense>
                </CardContent>
            </Card>
        </div>
    );
}
