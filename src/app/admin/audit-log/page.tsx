import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import db from '@/lib/db';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export const runtime = 'nodejs';

const PAGE_SIZE = 50;

function actionColor(action: string) {
    if (action.startsWith('delete')) return 'bg-red-100 text-red-800';
    if (action.startsWith('create')) return 'bg-green-100 text-green-800';
    if (action.startsWith('update') || action.startsWith('upsert')) return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-700';
}

export default async function AuditLogPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string; school?: string; model?: string }>;
}) {
    const session = await getSession();
    if (!session.isSuperAdmin) redirect('/login');

    const { page: pageStr, school: schoolFilter, model: modelFilter } = await searchParams;
    const page = Math.max(1, parseInt(pageStr ?? '1', 10));
    const skip = (page - 1) * PAGE_SIZE;

    const where: Record<string, unknown> = {};
    if (schoolFilter) where.schoolId = schoolFilter;
    if (modelFilter) where.targetType = modelFilter;

    const [logs, total, schools, models] = await Promise.all([
        db.auditLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: PAGE_SIZE,
            include: { school: { select: { name: true, slug: true } } },
        }),
        db.auditLog.count({ where }),
        db.school.findMany({ select: { id: true, name: true, slug: true }, orderBy: { name: 'asc' } }),
        db.auditLog.findMany({ select: { targetType: true }, distinct: ['targetType'], orderBy: { targetType: 'asc' } }),
    ]);

    const totalPages = Math.ceil(total / PAGE_SIZE);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Audit Log</h1>
                <p className="text-muted-foreground mt-1">{total.toLocaleString()} total events across all schools.</p>
            </div>

            {/* Filters */}
            <form method="GET" className="flex gap-3 flex-wrap">
                <select name="school" defaultValue={schoolFilter ?? ''} className="border border-border rounded-md px-3 py-2 text-sm bg-background">
                    <option value="">All schools</option>
                    {schools.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                </select>
                <select name="model" defaultValue={modelFilter ?? ''} className="border border-border rounded-md px-3 py-2 text-sm bg-background">
                    <option value="">All models</option>
                    {models.map((m) => (
                        <option key={m.targetType} value={m.targetType}>{m.targetType}</option>
                    ))}
                </select>
                <button type="submit" className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90">Filter</button>
                {(schoolFilter || modelFilter) && (
                    <a href="/admin/audit-log" className="px-4 py-2 text-sm border border-border rounded-md hover:bg-muted">Clear</a>
                )}
            </form>

            <Card className="border-border shadow-sm">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="pl-4">Timestamp</TableHead>
                                <TableHead>School</TableHead>
                                <TableHead>Action</TableHead>
                                <TableHead>Model</TableHead>
                                <TableHead>Target ID</TableHead>
                                <TableHead>Actor</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                                        No audit log entries found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                logs.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell className="pl-4 text-xs text-muted-foreground whitespace-nowrap">
                                            {format(log.createdAt, 'dd MMM yyyy, HH:mm:ss')}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            <span className="font-medium">{log.school.name}</span>
                                            <span className="text-muted-foreground text-xs ml-1">({log.school.slug})</span>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={`${actionColor(log.action)} text-xs hover:opacity-100`}>
                                                {log.action}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm font-medium">{log.targetType}</TableCell>
                                        <TableCell className="font-mono text-xs text-muted-foreground">{log.targetId.slice(0, 12)}…</TableCell>
                                        <TableCell className="text-xs">
                                            <span className="text-muted-foreground">{log.actorType}: </span>
                                            <span className="font-mono">{log.actorId.slice(0, 8)}…</span>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Page {page} of {totalPages}</span>
                    <div className="flex gap-2">
                        {page > 1 && (
                            <a
                                href={`/admin/audit-log?page=${page - 1}${schoolFilter ? `&school=${schoolFilter}` : ''}${modelFilter ? `&model=${modelFilter}` : ''}`}
                                className="px-3 py-1.5 border border-border rounded-md hover:bg-muted"
                            >
                                Previous
                            </a>
                        )}
                        {page < totalPages && (
                            <a
                                href={`/admin/audit-log?page=${page + 1}${schoolFilter ? `&school=${schoolFilter}` : ''}${modelFilter ? `&model=${modelFilter}` : ''}`}
                                className="px-3 py-1.5 border border-border rounded-md hover:bg-muted"
                            >
                                Next
                            </a>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
