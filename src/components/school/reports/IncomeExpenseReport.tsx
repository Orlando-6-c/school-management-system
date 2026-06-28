'use client';

import { useState, useTransition } from 'react';
import { getIncomeExpenseReport } from '@/actions/reports';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Printer } from 'lucide-react';
import { cn } from '@/lib/utils';

function downloadCSV(filename: string, headers: string[], dataRows: (string | number)[][]) {
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [headers, ...dataRows].map((r) => r.map(esc).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
}

type MonthRow = { month: string; income: number; expense: number; net: number };

function fmt(n: number) { return n.toLocaleString('en-PK', { minimumFractionDigits: 0 }); }

export function IncomeExpenseReport() {
    const currentYear = new Date().getFullYear();
    const [year, setYear] = useState(currentYear);
    const [months, setMonths] = useState<MonthRow[] | null>(null);
    const [totals, setTotals] = useState<{ income: number; expense: number } | null>(null);
    const [incomeByCategory, setIncomeByCategory] = useState<Record<string, number>>({});
    const [expenseByCategory, setExpenseByCategory] = useState<Record<string, number>>({});
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

    function load() {
        setError(null);
        startTransition(async () => {
            const res = await getIncomeExpenseReport(year);
            if (!res.success) { setError(res.message); return; }
            setMonths(res.months);
            setTotals({ income: res.totalIncome, expense: res.totalExpense });
            setIncomeByCategory(res.incomeByCategory);
            setExpenseByCategory(res.expenseByCategory);
        });
    }

    return (
        <div className="space-y-6">
            <div className="flex items-end gap-4 flex-wrap">
                <div className="space-y-1.5">
                    <Label>Year</Label>
                    <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                        <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                        <SelectContent>{years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                <Button onClick={load} disabled={isPending}>{isPending ? 'Loading…' : 'Generate'}</Button>
                {months && (
                    <div className="ml-auto flex gap-2">
                        <Button variant="outline" onClick={() => downloadCSV(
                            `income-expense-${year}.csv`,
                            ['Month', 'Income (Rs)', 'Expense (Rs)', 'Net (Rs)'],
                            months.map((m) => [m.month, m.income, m.expense, m.net])
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

            {totals && (
                <div className="grid grid-cols-3 gap-4">
                    <Card className="border-border shadow-sm">
                        <CardContent className="pt-4 pb-4">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Income</p>
                            <p className="text-2xl font-bold mt-1 text-green-700">Rs {fmt(totals.income)}</p>
                        </CardContent>
                    </Card>
                    <Card className="border-border shadow-sm">
                        <CardContent className="pt-4 pb-4">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Expense</p>
                            <p className="text-2xl font-bold mt-1 text-red-600">Rs {fmt(totals.expense)}</p>
                        </CardContent>
                    </Card>
                    <Card className="border-border shadow-sm">
                        <CardContent className="pt-4 pb-4">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Net Balance</p>
                            <p className={cn('text-2xl font-bold mt-1', totals.income - totals.expense >= 0 ? 'text-green-700' : 'text-red-600')}>
                                Rs {fmt(totals.income - totals.expense)}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {months && (
                <div className="grid lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <Card className="border-border shadow-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base">Monthly Breakdown — {year}</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="pl-4">Month</TableHead>
                                            <TableHead className="text-right">Income</TableHead>
                                            <TableHead className="text-right">Expense</TableHead>
                                            <TableHead className="text-right">Net</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {months.map((m) => (
                                            <TableRow key={m.month}>
                                                <TableCell className="pl-4 font-medium">{m.month}</TableCell>
                                                <TableCell className="text-right text-green-700 font-mono">{m.income > 0 ? `Rs ${fmt(m.income)}` : '—'}</TableCell>
                                                <TableCell className="text-right text-red-600 font-mono">{m.expense > 0 ? `Rs ${fmt(m.expense)}` : '—'}</TableCell>
                                                <TableCell className={cn('text-right font-mono font-semibold', m.net >= 0 ? 'text-green-700' : 'text-red-600')}>
                                                    {m.income === 0 && m.expense === 0 ? '—' : `Rs ${fmt(m.net)}`}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-4">
                        {Object.keys(incomeByCategory).length > 0 && (
                            <Card className="border-border shadow-sm">
                                <CardHeader className="pb-2"><CardTitle className="text-sm">Income by Category</CardTitle></CardHeader>
                                <CardContent className="space-y-2">
                                    {Object.entries(incomeByCategory).map(([cat, amt]) => (
                                        <div key={cat} className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">{cat}</span>
                                            <span className="font-medium text-green-700">Rs {fmt(amt)}</span>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}
                        {Object.keys(expenseByCategory).length > 0 && (
                            <Card className="border-border shadow-sm">
                                <CardHeader className="pb-2"><CardTitle className="text-sm">Expense by Category</CardTitle></CardHeader>
                                <CardContent className="space-y-2">
                                    {Object.entries(expenseByCategory).map(([cat, amt]) => (
                                        <div key={cat} className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">{cat}</span>
                                            <span className="font-medium text-red-600">Rs {fmt(amt)}</span>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
