import db from '@/lib/db';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { hasPermission } from '@/lib/authz';
import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SearchBar } from '@/components/ui/search-bar';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { Phone, Mail } from 'lucide-react';

export const runtime = 'nodejs';

const PAGE_SIZE = 50;

export default async function ParentsPage({
    searchParams,
}: {
    searchParams: Promise<{ search?: string; page?: string }>;
}) {
    const session = await getSession();
    if (!session.schoolId) redirect('/login');
    if (!(await hasPermission('parents', 'view'))) redirect('/school');

    const { search, page: pageStr } = await searchParams;
    const page = Math.max(1, parseInt(pageStr ?? '1', 10));
    const skip = (page - 1) * PAGE_SIZE;

    const where: Record<string, unknown> = {
        schoolId: session.schoolId,
        ...(search
            ? {
                  OR: [
                      { name: { contains: search, mode: 'insensitive' } },
                      { cnic: { contains: search, mode: 'insensitive' } },
                      { contact: { contains: search, mode: 'insensitive' } },
                  ],
              }
            : {}),
    };

    const [parents, totalCount] = await Promise.all([
        db.guardian.findMany({
            where,
            include: { students: { include: { class: true } } },
            orderBy: { name: 'asc' },
            skip,
            take: PAGE_SIZE,
        }),
        db.guardian.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Parents Directory</h1>

            <Card className="bg-card border-border shadow-sm">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <CardTitle className="text-foreground">Registered Guardians</CardTitle>
                            <CardDescription>
                                {totalCount} guardian{totalCount !== 1 ? 's' : ''}
                                {search ? ` matching "${search}"` : ''}
                                {' '}· Accounts auto-created on student admission.
                            </CardDescription>
                        </div>
                        <Suspense>
                            <SearchBar placeholder="Name, CNIC or contact…" className="w-60" />
                        </Suspense>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="pl-4 w-[200px]">Parent Name</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Login Credentials</TableHead>
                                <TableHead>Linked Children</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {parents.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                                        {search ? `No guardians matching "${search}".` : 'No guardians yet. Admit students to auto-create guardian accounts.'}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                parents.map((parent) => (
                                    <TableRow key={parent.id}>
                                        <TableCell className="pl-4 font-bold text-slate-800">
                                            {parent.name}
                                            <div className="text-xs text-muted-foreground font-normal mt-0.5">{parent.relation}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center text-sm text-slate-600 gap-1">
                                                <Phone className="w-3 h-3 shrink-0" /> {parent.contact}
                                            </div>
                                            {parent.email && (
                                                <div className="flex items-center text-sm text-slate-600 mt-1 gap-1">
                                                    <Mail className="w-3 h-3 shrink-0" /> {parent.email}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="bg-slate-50 border border-slate-200 rounded p-2.5 w-max text-xs">
                                                <div className="flex justify-between items-center gap-4">
                                                    <span className="text-slate-500 uppercase font-bold tracking-widest">Username</span>
                                                    <span className="font-mono font-black text-indigo-700">{parent.cnic}</span>
                                                </div>
                                                <div className="flex justify-between items-center gap-4 mt-1 border-t border-slate-200 pt-1">
                                                    <span className="text-slate-500 uppercase font-bold tracking-widest">Password</span>
                                                    <span className="font-mono text-slate-600">{parent.contact}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {parent.students.length === 0 ? (
                                                <span className="text-muted-foreground text-xs italic">No children linked</span>
                                            ) : (
                                                <div className="space-y-1.5">
                                                    {parent.students.map((child: any) => (
                                                        <div key={child.id} className="flex flex-col border-l-2 border-indigo-200 pl-2.5">
                                                            <span className="text-sm font-bold text-slate-700">{child.name}</span>
                                                            <span className="text-xs text-slate-500">
                                                                {child.rollNumber} · {child.class ? `${child.class.name} ${child.class.section ?? ''}`.trim() : 'Unassigned'}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </TableCell>
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
