import Link from 'next/link';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { hasPermission } from '@/lib/authz';
import db from '@/lib/db';
import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plus, Upload } from 'lucide-react';
import { TeacherTable } from '@/components/school/TeacherTable';
import { SearchBar } from '@/components/ui/search-bar';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { serializeData } from '@/lib/utils';

export const runtime = 'nodejs';

const PAGE_SIZE = 50;

export default async function TeachersPage({
    searchParams,
}: {
    searchParams: Promise<{ search?: string; page?: string }>;
}) {
    const session = await getSession();
    if (!session.schoolId) redirect('/login');
    if (!(await hasPermission('teachers', 'view'))) redirect('/school');

    const { search, page: pageStr } = await searchParams;
    const page = Math.max(1, parseInt(pageStr ?? '1', 10));
    const skip = (page - 1) * PAGE_SIZE;

    const where: Record<string, unknown> = {
        schoolId: session.schoolId,
        isActive: true,
        ...(search
            ? {
                  OR: [
                      { firstName: { contains: search, mode: 'insensitive' } },
                      { lastName: { contains: search, mode: 'insensitive' } },
                      { subject: { contains: search, mode: 'insensitive' } },
                      { cnic: { contains: search, mode: 'insensitive' } },
                  ],
              }
            : {}),
    };

    const [teachers, totalCount] = await Promise.all([
        db.teacher.findMany({
            where,
            orderBy: { firstName: 'asc' },
            skip,
            take: PAGE_SIZE,
        }),
        db.teacher.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Teachers Directory</h1>
                <div className="flex gap-2">
                    <Button asChild variant="outline">
                        <Link href="/school/teachers/import">
                            <Upload className="mr-2 h-4 w-4" />
                            Import CSV
                        </Link>
                    </Button>
                    <Button asChild>
                        <Link href="/school/teachers/new">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Teacher
                        </Link>
                    </Button>
                </div>
            </div>

            <Card className="bg-card border-border shadow-sm">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <CardTitle className="text-foreground">Registered Teachers</CardTitle>
                            <CardDescription>
                                {totalCount} teacher{totalCount !== 1 ? 's' : ''}
                                {search ? ` matching "${search}"` : ''}
                            </CardDescription>
                        </div>
                        <Suspense>
                            <SearchBar placeholder="Name, subject or CNIC…" className="w-64" />
                        </Suspense>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <TeacherTable teachers={serializeData(teachers)} session={serializeData(session)} />
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
