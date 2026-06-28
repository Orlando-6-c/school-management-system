'use client';

import { useState, useTransition } from 'react';
import { getSalaryRegisterReport } from '@/actions/reports';
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

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

type Row = { id: string; name: string; role: string; employeeType: string; baseSalary: number; allowances: number; deductions: number; netSalary: number; paidAt: string | null };

function fmt(n: number) { return n.toLocaleString('en-PK', { minimumFractionDigits: 0 }); }

const typeColor: Record<string, string> = {
    Teacher: 'bg-blue-100 text-blue-800',
    Staff: 'bg-purple-100 text-purple-800',
    Executive: 'bg-amber-100 text-amber-800',
};

export function SalaryRegisterReport() {
    const now = new Date();
    const [month, setMonth] = useState(MONTHS[now.getMonth()]);
    const [year, setYear] = useState(now.getFullYear());
    const [rows, setRows] = useState<Row[] | null>(null);
    const [totalNet, setTotalNet] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

    function load() {
        setError(null);
        startTransition(async () => {
            const res = await getSalaryRegisterReport(month, year);
            if (!res.success) { setError(res.message); return; }
            setRows(res.rows);
            setTotalNet(res.totalNet);
        });
    }

    return (
        <div className="space-y-6">
            <div className="flex items-end gap-4 flex-wrap">
                <div className="space-y-1.5">
                    <Label>Month</Label>
                    <Select value={month} onValueChange={setMonth}>
                        <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                        <SelectContent>{MONTHS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
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
                    <div className="ml-auto flex gap-2">
                        <Button variant="outline" onClick={() => downloadCSV(
                            `salary-register-${month}-${year}.csv`,
                            ['Name', 'Role', 'Type', 'Base Salary (Rs)', 'Allowances (Rs)', 'Deductions (Rs)', 'Net Salary (Rs)', 'Paid On'],
                            rows.map((r) => [r.name, r.role, r.employeeType, r.baseSalary, r.allowances, r.deductions, r.netSalary, r.paidAt ?? ''])
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
                                <p className="text-xs text-muted-foreground uppercase tracking-wide">Employees Paid</p>
                                <p className="text-2xl font-bold mt-1">{rows.length}</p>
                            </CardContent>
                        </Card>
                        <Card className="border-border shadow-sm">
                            <CardContent className="pt-4 pb-4">
                                <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Net Salaries</p>
                                <p className="text-2xl font-bold mt-1 text-green-700">Rs {fmt(totalNet)}</p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="border-border shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">Salary Register — {month} {year}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="pl-4">Name</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead className="text-right">Base</TableHead>
                                        <TableHead className="text-right">Allowances</TableHead>
                                        <TableHead className="text-right">Deductions</TableHead>
                                        <TableHead className="text-right">Net</TableHead>
                                        <TableHead>Paid On</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {rows.length === 0 ? (
                                        <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No salary slips found for this period.</TableCell></TableRow>
                                    ) : rows.map((r) => (
                                        <TableRow key={r.id}>
                                            <TableCell className="pl-4 font-medium">{r.name}</TableCell>
                                            <TableCell className="text-muted-foreground text-sm">{r.role}</TableCell>
                                            <TableCell>
                                                <Badge className={`${typeColor[r.employeeType] ?? 'bg-gray-100'} hover:opacity-100 text-xs`}>{r.employeeType}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-sm">Rs {fmt(r.baseSalary)}</TableCell>
                                            <TableCell className="text-right font-mono text-sm text-green-700">{r.allowances > 0 ? `+Rs ${fmt(r.allowances)}` : '—'}</TableCell>
                                            <TableCell className="text-right font-mono text-sm text-red-600">{r.deductions > 0 ? `-Rs ${fmt(r.deductions)}` : '—'}</TableCell>
                                            <TableCell className="text-right font-mono font-semibold">Rs {fmt(r.netSalary)}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">{r.paidAt ?? '—'}</TableCell>
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
