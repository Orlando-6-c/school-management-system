import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { hasPermission, userCan, getCurrentUserWithPermissions } from '@/lib/authz';
import { getStaff } from '@/actions/staff';
import db from '@/lib/db';
import Link from 'next/link';
import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Upload } from 'lucide-react';
import { SearchBar } from '@/components/ui/search-bar';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { DeleteStaffButton } from '@/components/school/DeleteStaffButton';

export const runtime = 'nodejs';

const PAGE_SIZE = 50;

export default async function StaffPage({
    searchParams,
}: {
    searchParams: Promise<{ search?: string; page?: string }>;
}) {
    const session = await getSession();
    if (!session.schoolId) redirect('/login');
    if (!(await hasPermission('staff', 'view'))) redirect('/school');

    const actor = await getCurrentUserWithPermissions();
    const canCreate = actor ? userCan(actor, 'staff', 'create') : false;
    const canEdit = actor ? userCan(actor, 'staff', 'edit') : false;
    const canDelete = actor ? userCan(actor, 'staff', 'delete') : false;

    const { search, page: pageStr } = await searchParams;
    const page = Math.max(1, parseInt(pageStr ?? '1', 10));
    const skip = (page - 1) * PAGE_SIZE;

    const where: Record<string, unknown> = {
        schoolId: session.schoolId,
        isActive: true,
        ...(search
            ? {
                  OR: [
                      { name: { contains: search, mode: 'insensitive' } },
                      { role: { contains: search, mode: 'insensitive' } },
                      { cnic: { contains: search, mode: 'insensitive' } },
                  ],
              }
            : {}),
    };

    const [staff, totalCount] = await Promise.all([
        db.staff.findMany({ where, orderBy: { name: 'asc' }, skip, take: PAGE_SIZE }),
        db.staff.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Staff</h1>
                    <p className="text-muted-foreground mt-1">Non-teaching staff members.</p>
                </div>
                <div className="flex gap-2">
                    {canCreate && (
                        <Button asChild variant="outline">
                            <Link href="/school/staff/import"><Upload className="h-4 w-4 mr-2" />Import CSV</Link>
                        </Button>
                    )}
                    {canCreate && (
                        <Button asChild>
                            <Link href="/school/staff/new"><Plus className="h-4 w-4 mr-2" />Add Staff</Link>
                        </Button>
                    )}
                </div>
            </div>

            <Card className="border-border shadow-sm">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <CardTitle>Staff Members</CardTitle>
                            <CardDescription>
                                {totalCount} member{totalCount !== 1 ? 's' : ''}
                                {search ? ` matching "${search}"` : ''}
                            </CardDescription>
                        </div>
                        <Suspense>
                            <SearchBar placeholder="Name, role or CNIC…" className="w-56" />
                        </Suspense>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="pl-4">Name</TableHead>
                                <TableHead>Role / Designation</TableHead>
                                <TableHead>CNIC</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Gender</TableHead>
                                <TableHead>Hours</TableHead>
                                {(canEdit || canDelete) && <TableHead className="text-right pr-4">Actions</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {staff.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                                        No staff members found.
                                        {canCreate && !search && (
                                            <> <Link href="/school/staff/new" className="text-primary underline">Add one now.</Link></>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                staff.map((s) => (
                                    <TableRow key={s.id}>
                                        <TableCell className="pl-4 font-medium">{s.name}</TableCell>
                                        <TableCell><Badge variant="outline">{s.role}</Badge></TableCell>
                                        <TableCell className="font-mono text-sm">{s.cnic}</TableCell>
                                        <TableCell className="text-sm">{s.contact}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{s.gender}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{s.workingHours}</TableCell>
                                        {(canEdit || canDelete) && (
                                            <TableCell className="text-right pr-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    {canEdit && (
                                                        <Button variant="ghost" size="sm" asChild>
                                                            <Link href={`/school/staff/${s.id}/edit`}><Pencil className="h-3.5 w-3.5" /></Link>
                                                        </Button>
                                                    )}
                                                    {canDelete && <DeleteStaffButton staffId={s.id} staffName={s.name} />}
                                                </div>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
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
