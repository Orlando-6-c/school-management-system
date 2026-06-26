'use client';

import { useState, useTransition, useMemo } from 'react';
import { format } from 'date-fns';
import { generateMonthlySalarySlips, markSalarySlipPaid } from '@/actions/finance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle2 } from 'lucide-react';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const THIS_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => String(THIS_YEAR - 1 + i));

function fmt(n: number) {
    return 'Rs ' + Number(n).toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function statusBadge(status: string) {
    return status === 'Paid'
        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
        : 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400';
}

interface Slip {
    id: string;
    slipNumber: string;
    month: string;
    year: number;
    baseSalary: number;
    allowances: number;
    deductions: number;
    netSalary: number;
    status: string;
    paidAt: string | null;
    remarks: string | null;
    employeeType: string;
    teacher?: { id: string; firstName: string; lastName: string } | null;
    staff?: { id: string; name: string } | null;
}

function employeeName(slip: Slip) {
    if (slip.teacher) return `${slip.teacher.firstName} ${slip.teacher.lastName}`;
    if (slip.staff) return slip.staff.name;
    return '—';
}

export default function SalarySlipsClient({ slips: initial }: { slips: Slip[] }) {
    const [slips, setSlips] = useState(initial);
    const [isPending, startTransition] = useTransition();

    // Generate form state
    const [genMonth, setGenMonth] = useState(MONTHS[new Date().getMonth()]);
    const [genYear, setGenYear] = useState(String(THIS_YEAR));
    const [genMsg, setGenMsg] = useState<{ ok: boolean; text: string } | null>(null);

    // Filter state
    const [filterMonth, setFilterMonth] = useState('All');
    const [filterYear, setFilterYear] = useState('All');
    const [filterStatus, setFilterStatus] = useState('All');

    // Mark-paid dialog
    const [markingSlip, setMarkingSlip] = useState<Slip | null>(null);
    const [paidAt, setPaidAt] = useState(new Date().toISOString().split('T')[0]);

    function handleGenerate() {
        setGenMsg(null);
        startTransition(async () => {
            const res = await generateMonthlySalarySlips(genMonth, Number(genYear));
            setGenMsg({ ok: !!res.success, text: res.message ?? '' });
            if (res.success) {
                // Reload slips by refreshing — use window.location or refetch via server
                window.location.reload();
            }
        });
    }

    function openMarkPaid(slip: Slip) {
        setMarkingSlip(slip);
        setPaidAt(new Date().toISOString().split('T')[0]);
    }

    function handleMarkPaid() {
        if (!markingSlip) return;
        startTransition(async () => {
            const res = await markSalarySlipPaid(markingSlip.id, new Date(paidAt));
            if (res.success) {
                setSlips(prev => prev.map(s => s.id === markingSlip.id
                    ? { ...s, status: 'Paid', paidAt: paidAt }
                    : s
                ));
                setMarkingSlip(null);
            } else {
                alert(res.message);
            }
        });
    }

    const availableYears = useMemo(() => {
        const ys = [...new Set(slips.map(s => s.year.toString()))].sort((a, b) => Number(b) - Number(a));
        return ['All', ...ys];
    }, [slips]);

    const filtered = useMemo(() => slips.filter(s => {
        if (filterMonth !== 'All' && s.month !== filterMonth) return false;
        if (filterYear !== 'All' && s.year.toString() !== filterYear) return false;
        if (filterStatus !== 'All' && s.status !== filterStatus) return false;
        return true;
    }), [slips, filterMonth, filterYear, filterStatus]);

    const pendingTotal = filtered.filter(s => s.status === 'Pending').reduce((t, s) => t + Number(s.netSalary), 0);
    const paidTotal = filtered.filter(s => s.status === 'Paid').reduce((t, s) => t + Number(s.netSalary), 0);

    return (
        <div className="space-y-5">
            {/* Generate form */}
            <div className="bg-card border border-border rounded-xl p-5">
                <h2 className="text-sm font-semibold text-foreground mb-3">Generate Slips for a Month</h2>
                <div className="flex flex-wrap items-end gap-3">
                    <div className="space-y-1.5">
                        <Label className="text-xs">Month</Label>
                        <Select value={genMonth} onValueChange={setGenMonth}>
                            <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs">Year</Label>
                        <Select value={genYear} onValueChange={setGenYear}>
                            <SelectTrigger className="w-24 h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button size="sm" onClick={handleGenerate} disabled={isPending} className="h-8">
                        {isPending ? 'Generating…' : 'Generate'}
                    </Button>
                    {genMsg && (
                        <p className={`text-xs ${genMsg.ok ? 'text-emerald-600' : 'text-destructive'}`}>{genMsg.text}</p>
                    )}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                    Generates Pending salary slips for all active staff and teachers who have a salary set. Existing slips for the same month are skipped.
                </p>
            </div>

            {/* Summary strip */}
            <div className="grid grid-cols-3 gap-3">
                <div className="bg-card border border-border rounded-lg px-4 py-3">
                    <p className="text-xs text-muted-foreground">Pending (filtered)</p>
                    <p className="text-lg font-semibold text-foreground mt-0.5">{fmt(pendingTotal)}</p>
                </div>
                <div className="bg-card border border-border rounded-lg px-4 py-3">
                    <p className="text-xs text-muted-foreground">Paid (filtered)</p>
                    <p className="text-lg font-semibold text-foreground mt-0.5">{fmt(paidTotal)}</p>
                </div>
                <div className="bg-card border border-border rounded-lg px-4 py-3">
                    <p className="text-xs text-muted-foreground">Total slips</p>
                    <p className="text-lg font-semibold text-foreground mt-0.5">{filtered.length}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 p-3 bg-muted/40 rounded-lg border border-border">
                <Select value={filterMonth} onValueChange={setFilterMonth}>
                    <SelectTrigger className="w-36 bg-card"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="All">All Months</SelectItem>
                        {MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={filterYear} onValueChange={setFilterYear}>
                    <SelectTrigger className="w-28 bg-card"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {availableYears.map(y => <SelectItem key={y} value={y}>{y === 'All' ? 'All Years' : y}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-32 bg-card"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="All">All Statuses</SelectItem>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Paid">Paid</SelectItem>
                    </SelectContent>
                </Select>
                {(filterMonth !== 'All' || filterYear !== 'All' || filterStatus !== 'All') && (
                    <Button variant="ghost" size="sm" onClick={() => { setFilterMonth('All'); setFilterYear('All'); setFilterStatus('All'); }}>
                        Clear
                    </Button>
                )}
            </div>

            {/* Table */}
            <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-muted/40 border-b border-border">
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Slip No.</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Employee</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Type</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Month / Year</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Base</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Net Pay</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Status</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground text-sm">
                                    No salary slips found.
                                </td>
                            </tr>
                        ) : filtered.map((slip) => (
                            <tr key={slip.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{slip.slipNumber}</td>
                                <td className="px-4 py-3 font-medium text-foreground">{employeeName(slip)}</td>
                                <td className="px-4 py-3 text-muted-foreground">{slip.employeeType}</td>
                                <td className="px-4 py-3 text-muted-foreground">{slip.month} {slip.year}</td>
                                <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{fmt(Number(slip.baseSalary))}</td>
                                <td className="px-4 py-3 text-right tabular-nums font-semibold text-foreground">{fmt(Number(slip.netSalary))}</td>
                                <td className="px-4 py-3 text-center">
                                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${statusBadge(slip.status)}`}>
                                        {slip.status}
                                    </span>
                                    {slip.status === 'Paid' && slip.paidAt && (
                                        <div className="text-xs text-muted-foreground mt-0.5">{format(new Date(slip.paidAt), 'dd MMM yyyy')}</div>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    {slip.status === 'Pending' && (
                                        <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={() => openMarkPaid(slip)}>
                                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                            Mark Paid
                                        </Button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mark Paid Dialog */}
            <Dialog open={!!markingSlip} onOpenChange={(open) => !open && setMarkingSlip(null)}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Mark Salary as Paid</DialogTitle>
                    </DialogHeader>
                    {markingSlip && (
                        <div className="space-y-4 pt-2">
                            <div className="bg-muted/50 rounded-lg px-4 py-3 text-sm space-y-1">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Employee</span>
                                    <span className="font-medium">{employeeName(markingSlip)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Period</span>
                                    <span>{markingSlip.month} {markingSlip.year}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Net Salary</span>
                                    <span className="font-semibold">{fmt(Number(markingSlip.netSalary))}</span>
                                </div>
                                {Number(markingSlip.allowances) > 0 && (
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>+ Allowances</span>
                                        <span>{fmt(Number(markingSlip.allowances))}</span>
                                    </div>
                                )}
                                {Number(markingSlip.deductions) > 0 && (
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>− Deductions</span>
                                        <span>{fmt(Number(markingSlip.deductions))}</span>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-1.5">
                                <Label>Payment Date</Label>
                                <Input type="date" value={paidAt} onChange={e => setPaidAt(e.target.value)} />
                            </div>
                            <div className="flex justify-end gap-2 pt-1">
                                <Button variant="outline" onClick={() => setMarkingSlip(null)}>Cancel</Button>
                                <Button onClick={handleMarkPaid} disabled={isPending}>
                                    {isPending ? 'Saving…' : 'Confirm Payment'}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
