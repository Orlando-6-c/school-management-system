'use client';

import { useState, useMemo, useTransition } from 'react';
import { format } from 'date-fns';
import { deleteExpenseRecord } from '@/actions/finance';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2 } from 'lucide-react';

const CATEGORIES = ['All', 'Salary', 'Utilities', 'Supplies', 'Maintenance', 'Other'];
const MONTHS = ['All','January','February','March','April','May','June','July','August','September','October','November','December'];

function fmt(n: number) {
    return 'Rs ' + n.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

interface ExpenseRecord {
    id: string;
    transactionId: string;
    description: string;
    amount: number;
    category: string;
    paidTo: string;
    paymentMethod: string;
    date: string;
    isAutomatic: boolean;
}

export default function ExpenseTable({ expenseRecords }: { expenseRecords: ExpenseRecord[] }) {
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('All');
    const [month, setMonth] = useState('All');
    const [year, setYear] = useState('All');
    const [deleting, setDeleting] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const [localRecords, setLocalRecords] = useState(expenseRecords);

    const years = useMemo(() => {
        const ys = [...new Set(localRecords.map((r) => new Date(r.date).getFullYear().toString()))].sort((a, b) => Number(b) - Number(a));
        return ['All', ...ys];
    }, [localRecords]);

    const filtered = useMemo(() => {
        return localRecords.filter((r) => {
            const q = search.toLowerCase();
            if (q && !r.description?.toLowerCase().includes(q) && !r.paidTo?.toLowerCase().includes(q) && !r.transactionId?.toLowerCase().includes(q)) return false;
            if (category !== 'All' && r.category !== category) return false;
            const d = new Date(r.date);
            if (month !== 'All' && d.toLocaleString('default', { month: 'long' }) !== month) return false;
            if (year !== 'All' && d.getFullYear().toString() !== year) return false;
            return true;
        });
    }, [localRecords, search, category, month, year]);

    const total = filtered.reduce((s, r) => s + Number(r.amount), 0);

    function handleDelete(id: string) {
        if (!confirm('Delete this expense record? This cannot be undone.')) return;
        setDeleting(id);
        startTransition(async () => {
            const res = await deleteExpenseRecord(id);
            if (res.success) {
                setLocalRecords((prev) => prev.filter((r) => r.id !== id));
            } else {
                alert(res.message);
            }
            setDeleting(null);
        });
    }

    return (
        <div className="space-y-4">
            {/* Filter bar */}
            <div className="flex flex-wrap gap-3 p-3 bg-muted/40 rounded-lg border border-border">
                <Input
                    placeholder="Search description, paid to, ID…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-xs bg-card"
                />
                <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="w-36 bg-card"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c === 'All' ? 'All Categories' : c}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={month} onValueChange={setMonth}>
                    <SelectTrigger className="w-36 bg-card"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {MONTHS.map((m) => <SelectItem key={m} value={m}>{m === 'All' ? 'All Months' : m}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={year} onValueChange={setYear}>
                    <SelectTrigger className="w-28 bg-card"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {years.map((y) => <SelectItem key={y} value={y}>{y === 'All' ? 'All Years' : y}</SelectItem>)}
                    </SelectContent>
                </Select>
                {(search || category !== 'All' || month !== 'All' || year !== 'All') && (
                    <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setCategory('All'); setMonth('All'); setYear('All'); }}>
                        Clear
                    </Button>
                )}
            </div>

            {/* Table */}
            <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-muted/40 border-b border-border">
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Date</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Category</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Description</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Paid To</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Method</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Amount</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Auto</th>
                            <th className="px-4 py-3" />
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground text-sm">
                                    No records match the current filters.
                                </td>
                            </tr>
                        ) : (
                            filtered.map((r) => (
                                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                                    <td className="px-4 py-3 text-muted-foreground tabular-nums whitespace-nowrap">
                                        {format(new Date(r.date), 'dd MMM yyyy')}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
                                            {r.category}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-foreground max-w-[220px] truncate">{r.description}</td>
                                    <td className="px-4 py-3 text-muted-foreground max-w-[140px] truncate">{r.paidTo}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{r.paymentMethod}</td>
                                    <td className="px-4 py-3 text-right font-medium tabular-nums text-foreground">{fmt(Number(r.amount))}</td>
                                    <td className="px-4 py-3 text-center">
                                        {r.isAutomatic && (
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                                                Auto
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {!r.isAutomatic && (
                                            <button
                                                onClick={() => handleDelete(r.id)}
                                                disabled={deleting === r.id || isPending}
                                                className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                    {filtered.length > 0 && (
                        <tfoot>
                            <tr className="border-t border-border bg-muted/40">
                                <td colSpan={5} className="px-4 py-3 text-xs font-medium text-muted-foreground">
                                    {filtered.length} record{filtered.length !== 1 ? 's' : ''}
                                </td>
                                <td className="px-4 py-3 text-right font-semibold tabular-nums text-foreground">
                                    {fmt(total)}
                                </td>
                                <td colSpan={2} />
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>
        </div>
    );
}
