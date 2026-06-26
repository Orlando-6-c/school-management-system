'use client';

import { useState, useTransition } from 'react';
import { getFeeCollectionReport } from '@/actions/reports';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Printer } from 'lucide-react';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

type Row = { id: string; challanNumber: string; studentName: string; rollNumber: string; className: string; amount: number; paidAmount: number; status: string; dueDate: string };
type Summary = { total: number; paid: number; pending: number; overdue: number; partiallyPaid: number; totalAmount: number; collectedAmount: number };

function statusBadge(status: string) {
    const map: Record<string, string> = {
        Paid: 'bg-green-100 text-green-800',
        Pending: 'bg-yellow-100 text-yellow-800',
        Overdue: 'bg-red-100 text-red-800',
        PartiallyPaid: 'bg-blue-100 text-blue-800',
        Cancelled: 'bg-gray-100 text-gray-600',
    };
    return <Badge className={`${map[status] ?? 'bg-gray-100'} hover:opacity-100`}>{status}</Badge>;
}

function fmt(n: number) { return n.toLocaleString('en-PK', { minimumFractionDigits: 0 }); }

export function FeeCollectionReport() {
    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());
    const [summary, setSummary] = useState<Summary | null>(null);
    const [rows, setRows] = useState<Row[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

    function load() {
        setError(null);
        startTransition(async () => {
            const res = await getFeeCollectionReport(month, year);
            if (!res.success) { setError(res.message); return; }
            setSummary(res.summary);
            setRows(res.rows);
        });
    }

    return (
        <div className="space-y-6">
            <div className="flex items-end gap-4 flex-wrap">
                <div className="space-y-1.5">
                    <Label>Month</Label>
                    <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
                        <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                        <SelectContent>{MONTHS.map((m, i) => <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                <div className="space-y-1.5">
                    <Label>Year</Label>
                    <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                        <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                        <SelectContent>{years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                <Button onClick={load} disabled={isPending}>{isPending ? 'Loading…' : 'Generate'}</Button>
                {rows && (
                    <Button variant="outline" onClick={() => window.print()} className="ml-auto">
                        <Printer className="h-4 w-4 mr-2" /> Print
                    </Button>
                )}
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            {summary && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 print:grid-cols-4">
                    {[
                        { label: 'Total Challans', value: summary.total },
                        { label: 'Paid', value: summary.paid, color: 'text-green-700' },
                        { label: 'Pending', value: summary.pending, color: 'text-yellow-600' },
                        { label: 'Overdue', value: summary.overdue, color: 'text-red-600' },
                    ].map(({ label, value, color }) => (
                        <Card key={label} className="border-border shadow-sm">
                            <CardContent className="pt-4 pb-4">
                                <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
                                <p className={`text-2xl font-bold mt-1 ${color ?? 'text-foreground'}`}>{value}</p>
                            </CardContent>
                        </Card>
                    ))}
                    <Card className="border-border shadow-sm sm:col-span-2">
                        <CardContent className="pt-4 pb-4">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Billed</p>
                            <p className="text-2xl font-bold mt-1">Rs {fmt(summary.totalAmount)}</p>
                        </CardContent>
                    </Card>
                    <Card className="border-border shadow-sm sm:col-span-2">
                        <CardContent className="pt-4 pb-4">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Collected</p>
                            <p className="text-2xl font-bold mt-1 text-green-700">Rs {fmt(summary.collectedAmount)}</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {rows && (
                <Card className="border-border shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Challans — {MONTHS[month - 1]} {year}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="pl-4">Challan #</TableHead>
                                    <TableHead>Student</TableHead>
                                    <TableHead>Class</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead className="text-right">Paid</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Due Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rows.length === 0 ? (
                                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No challans found for this period.</TableCell></TableRow>
                                ) : rows.map((r) => (
                                    <TableRow key={r.id}>
                                        <TableCell className="pl-4 font-mono text-sm">{r.challanNumber}</TableCell>
                                        <TableCell>
                                            <span className="font-medium">{r.studentName}</span>
                                            <span className="text-xs text-muted-foreground ml-1">({r.rollNumber})</span>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">{r.className}</TableCell>
                                        <TableCell className="text-right font-mono">Rs {fmt(r.amount)}</TableCell>
                                        <TableCell className="text-right font-mono text-green-700">Rs {fmt(r.paidAmount)}</TableCell>
                                        <TableCell>{statusBadge(r.status)}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{r.dueDate}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
