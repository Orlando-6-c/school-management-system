import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { hasPermission } from '@/lib/authz';
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

export default async function SchoolAuditLogPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string; model?: string }>;
}) {
    const session = await getSession();
    if (!session.schoolId) redirect('/login');
    if (!(await hasPermission('settings', 'view'))) redirect('/school');

    const { page: pageStr, model: modelFilter } = await searchParams;
    const page = Math.max(1, parseInt(pageStr ?? '1', 10));
    const skip = (page - 1) * PAGE_SIZE;

    const where: Record<string, unknown> = { schoolId: session.schoolId };
    if (modelFilter) where.targetType = modelFilter;

    const [logs, total, models, users] = await Promise.all([
        db.auditLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: PAGE_SIZE,
        }),
        db.auditLog.count({ where }),
        db.auditLog.findMany({
            where: { schoolId: session.schoolId },
            select: { targetType: true },
            distinct: ['targetType'],
            orderBy: { targetType: 'asc' },
        }),
        db.user.findMany({
            where: { schoolId: session.schoolId },
            select: { id: true, username: true, role: true },
        }),
    ]);

    const userMap = Object.fromEntries(users.map((u) => [u.id, u]));
    const totalPages = Math.ceil(total / PAGE_SIZE);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Audit Log</h1>
                <p className="text-muted-foreground mt-1">{total.toLocaleString()} total events in your school.</p>
            </div>

            <form method="GET" className="flex gap-3 flex-wrap">
                <select name="model" defaultValue={modelFilter ?? ''} className="border border-border rounded-md px-3 py-2 text-sm bg-background">
                    <option value="">All models</option>
                    {models.map((m) => (
                        <option key={m.targetType} value={m.targetType}>{m.targetType}</option>
                    ))}
                </select>
                <button type="submit" className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90">Filter</button>
                {modelFilter && (
                    <a href="/school/settings/audit-log" className="px-4 py-2 text-sm border border-border rounded-md hover:bg-muted">Clear</a>
                )}
            </form>

            <Card className="border-border shadow-sm">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="pl-4">Timestamp</TableHead>
                                <TableHead>Action</TableHead>
                                <TableHead>Model</TableHead>
                                <TableHead>Target ID</TableHead>
                                <TableHead>Performed By</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                                        No audit events recorded yet.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                logs.map((log) => {
                                    const actor = userMap[log.actorId];
                                    return (
                                        <TableRow key={log.id}>
                                            <TableCell className="pl-4 text-xs text-muted-foreground whitespace-nowrap">
                                                {format(log.createdAt, 'dd MMM yyyy, HH:mm:ss')}
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={`${actionColor(log.action)} text-xs hover:opacity-100`}>
                                                    {log.action}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm font-medium">{log.targetType}</TableCell>
                                            <TableCell className="font-mono text-xs text-muted-foreground">{log.targetId.slice(0, 12)}…</TableCell>
                                            <TableCell className="text-sm">
                                                {actor ? (
                                                    <span>
                                                        <span className="font-medium">{actor.username}</span>
                                                        <span className="text-muted-foreground text-xs ml-1">({actor.role})</span>
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground text-xs font-mono">{log.actorId.slice(0, 8)}…</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {totalPages > 1 && (
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Page {page} of {totalPages}</span>
                    <div className="flex gap-2">
                        {page > 1 && (
                            <a
                                href={`/school/settings/audit-log?page=${page - 1}${modelFilter ? `&model=${modelFilter}` : ''}`}
                                className="px-3 py-1.5 border border-border rounded-md hover:bg-muted"
                            >
                                Previous
                            </a>
                        )}
                        {page < totalPages && (
                            <a
                                href={`/school/settings/audit-log?page=${page + 1}${modelFilter ? `&model=${modelFilter}` : ''}`}
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
