'use client';

import { useState, useTransition } from 'react';
import { getDefaultersReport } from '@/actions/reports';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Download, Printer } from 'lucide-react';

function downloadCSV(filename: string, headers: string[], dataRows: (string | number)[][]) {
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [headers, ...dataRows].map((r) => r.map(esc).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
}

interface ClassOption { id: string; name: string; section: string | null }
interface DefaultersReportProps { classes: ClassOption[] }

type Row = { challanId: string; challanNumber: string; studentId: string; studentName: string; rollNumber: string; className: string; amount: number; paidAmount: number; balance: number; status: string; dueDate: string; daysOverdue: number };

function fmt(n: number) { return n.toLocaleString('en-PK', { minimumFractionDigits: 0 }); }

export function DefaultersReport({ classes }: DefaultersReportProps) {
    const [classId, setClassId] = useState('all');
    const [rows, setRows] = useState<Row[] | null>(null);
    const [totalBalance, setTotalBalance] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    function load() {
        setError(null);
        startTransition(async () => {
            const res = await getDefaultersReport(classId === 'all' ? undefined : classId);
            if (!res.success) { setError(res.message); return; }
            setRows(res.rows);
            setTotalBalance(res.totalBalance);
        });
    }

    return (
        <div className="space-y-6">
            <div className="flex items-end gap-4 flex-wrap">
                <div className="space-y-1.5">
                    <Label>Class (optional)</Label>
                    <Select value={classId} onValueChange={setClassId}>
                        <SelectTrigger className="w-48"><SelectValue placeholder="All Classes" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Classes</SelectItem>
                            {classes.map((c) => (
                                <SelectItem key={c.id} value={c.id}>{c.name}{c.section ? ` (${c.section})` : ''}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <Button onClick={load} disabled={isPending}>{isPending ? 'Loading…' : 'Generate'}</Button>
                {rows && (
                    <div className="ml-auto flex gap-2">
                        <Button variant="outline" onClick={() => downloadCSV(
                            'defaulters-report.csv',
                            ['Roll #', 'Student', 'Class', 'Challan #', 'Total (Rs)', 'Paid (Rs)', 'Balance (Rs)', 'Status', 'Due Date', 'Days Overdue'],
                            rows.map((r) => [r.rollNumber, r.studentName, r.className, r.challanNumber, r.amount, r.paidAmount, r.balance, r.status, r.dueDate, r.daysOverdue])
                        )}>
                            <Download className="h-4 w-4 mr-2" /> CSV
                        </Button>
                        <Button variant="outline" onClick={() => window.print()}>
                            <Printer className="h-4 w-4 mr-2" /> Print
                        </Button>
                    </div>
                )}
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            {rows && (
                <>
                    <div className="grid grid-cols-2 gap-4">
                        <Card className="border-border shadow-sm">
                            <CardContent className="pt-4 pb-4">
                                <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Defaulters</p>
                                <p className="text-2xl font-bold mt-1 text-red-600">{rows.length}</p>
                            </CardContent>
                        </Card>
                        <Card className="border-border shadow-sm">
                            <CardContent className="pt-4 pb-4">
                                <p className="text-xs text-muted-foreground uppercase tracking-wide">Outstanding Balance</p>
                                <p className="text-2xl font-bold mt-1 text-red-600">Rs {fmt(totalBalance)}</p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="border-border shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">Defaulters List</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="pl-4">Roll #</TableHead>
                                        <TableHead>Student</TableHead>
                                        <TableHead>Class</TableHead>
                                        <TableHead>Challan #</TableHead>
                                        <TableHead className="text-right">Balance</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Due Date</TableHead>
                                        <TableHead className="text-center">Days Overdue</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {rows.length === 0 ? (
                                        <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No defaulters found.</TableCell></TableRow>
                                    ) : rows.map((r) => (
                                        <TableRow key={r.challanId}>
                                            <TableCell className="pl-4 font-mono text-sm">{r.rollNumber}</TableCell>
                                            <TableCell className="font-medium">{r.studentName}</TableCell>
                                            <TableCell className="text-muted-foreground text-sm">{r.className}</TableCell>
                                            <TableCell className="font-mono text-sm">{r.challanNumber}</TableCell>
                                            <TableCell className="text-right font-mono font-semibold text-red-600">Rs {fmt(r.balance)}</TableCell>
                                            <TableCell>
                                                <Badge className="bg-red-100 text-red-800 hover:bg-red-100">{r.status}</Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">{r.dueDate}</TableCell>
                                            <TableCell className="text-center font-semibold text-red-600">{r.daysOverdue}d</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}
