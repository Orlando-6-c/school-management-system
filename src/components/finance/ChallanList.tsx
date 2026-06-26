'use client';

import { useState, useMemo, useTransition } from 'react';
import { format } from 'date-fns';
import Link from 'next/link';
import { markChallanPaid, cancelChallan } from '@/actions/finance';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Printer } from 'lucide-react';
import BulkPrintDialog from '@/components/finance/BulkPrintDialog';

const MONTHS = ['All','January','February','March','April','May','June','July','August','September','October','November','December'];
const STATUSES = ['All', 'Pending', 'Paid', 'Overdue', 'Cancelled'];

function fmt(n: number) {
    return 'Rs ' + n.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function statusBadge(status: string) {
    const map: Record<string, string> = {
        Paid:      'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
        Pending:   'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
        Overdue:   'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
        Cancelled: 'bg-muted text-muted-foreground',
    };
    return (
        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${map[status] || 'bg-muted text-muted-foreground'}`}>
            {status}
        </span>
    );
}

interface Challan {
    id: string;
    challanNumber: string;
    month: string;
    year: number;
    totalAmount: number;
    paidAmount: number;
    dueDate: string;
    status: string;
    student: { id: string; name: string; rollNumber: string; class: { id: string; name: string; section: string | null } | null };
}

interface Student { id: string; name: string; rollNumber: string; classId: string | null }

interface Props {
    challans: Challan[];
    classes: { id: string; name: string; section: string | null }[];
    students: Student[];
}

export default function ChallanList({ challans, classes, students }: Props) {
    const [search, setSearch] = useState('');
    const [classId, setClassId] = useState('all');
    const [month, setMonth] = useState('All');
    const [year, setYear] = useState('All');
    const [status, setStatus] = useState('All');
    const [localChallans, setLocalChallans] = useState(challans);

    // Mark-paid dialog
    const [markingChallan, setMarkingChallan] = useState<Challan | null>(null);
    const [paidAmount, setPaidAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [paidAt, setPaidAt] = useState(new Date().toISOString().split('T')[0]);
    const [isPending, startTransition] = useTransition();

    // Post-payment print prompt
    const [printPrompt, setPrintPrompt] = useState<{ challanId: string; message: string } | null>(null);
    const [bulkPrintOpen, setBulkPrintOpen] = useState(false);

    const years = useMemo(() => {
        const ys = [...new Set(localChallans.map((c) => c.year.toString()))].sort((a, b) => Number(b) - Number(a));
        return ['All', ...ys];
    }, [localChallans]);

    const filteredByClass = useMemo(() => {
        return localChallans.filter((c) => {
            const q = search.toLowerCase();
            if (q && !c.challanNumber.toLowerCase().includes(q) && !c.student.name.toLowerCase().includes(q) && !c.student.rollNumber.toLowerCase().includes(q)) return false;
            if (classId !== 'all' && c.student.class?.id !== classId) return false;
            if (month !== 'All' && c.month !== month) return false;
            if (year !== 'All' && c.year.toString() !== year) return false;
            if (status !== 'All' && c.status !== status) return false;
            return true;
        });
    }, [localChallans, search, classId, month, year, status]);

    const pendingTotal = filteredByClass
        .filter(c => c.status === 'Pending' || c.status === 'Overdue')
        .reduce((s, c) => s + Number(c.totalAmount), 0);
    const paidTotal = filteredByClass.filter(c => c.status === 'Paid').reduce((s, c) => s + Number(c.paidAmount), 0);

    function openMarkPaid(challan: Challan) {
        const remaining = Number(challan.totalAmount) - Number(challan.paidAmount);
        setMarkingChallan(challan);
        setPaidAmount(remaining.toString());
        setPaymentMethod('Cash');
        setPaidAt(new Date().toISOString().split('T')[0]);
    }

    function submitMarkPaid() {
        if (!markingChallan) return;
        startTransition(async () => {
            const res = await markChallanPaid(
                markingChallan.id,
                parseFloat(paidAmount),
                paymentMethod,
                new Date(paidAt)
            );
            if (res.success) {
                const isFullyPaid = (res as any).isFullyPaid;
                const newPaidAmount = Number(markingChallan.paidAmount) + parseFloat(paidAmount);
                setLocalChallans(prev => prev.map(c => c.id === markingChallan.id
                    ? { ...c, status: isFullyPaid ? 'Paid' : 'Pending', paidAmount: newPaidAmount }
                    : c
                ));
                setMarkingChallan(null);
                setPrintPrompt({ challanId: markingChallan.id, message: res.message ?? '' });
            } else {
                alert(res.message);
            }
        });
    }

    function handleCancel(challanId: string, challanNumber: string) {
        if (!confirm(`Cancel challan ${challanNumber}? This cannot be undone.`)) return;
        startTransition(async () => {
            const res = await cancelChallan(challanId);
            if (res.success) {
                setLocalChallans(prev => prev.map(c => c.id === challanId ? { ...c, status: 'Cancelled' } : c));
            } else {
                alert(res.message);
            }
        });
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button size="sm" variant="outline" onClick={() => setBulkPrintOpen(true)}>
                    <Printer className="h-4 w-4 mr-1.5" />
                    Bulk Print
                </Button>
            </div>

            {/* Summary strip */}
            <div className="grid grid-cols-3 gap-3">
                <div className="bg-card border border-border rounded-lg px-4 py-3">
                    <p className="text-xs text-muted-foreground">Outstanding (filtered)</p>
                    <p className="text-lg font-semibold text-foreground mt-0.5">{fmt(pendingTotal)}</p>
                </div>
                <div className="bg-card border border-border rounded-lg px-4 py-3">
                    <p className="text-xs text-muted-foreground">Collected (filtered)</p>
                    <p className="text-lg font-semibold text-foreground mt-0.5">{fmt(paidTotal)}</p>
                </div>
                <div className="bg-card border border-border rounded-lg px-4 py-3">
                    <p className="text-xs text-muted-foreground">Total challans</p>
                    <p className="text-lg font-semibold text-foreground mt-0.5">{filteredByClass.length}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 p-3 bg-muted/40 rounded-lg border border-border">
                <Input
                    placeholder="Search name, roll no, challan no…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-xs bg-card"
                />
                <Select value={classId} onValueChange={setClassId}>
                    <SelectTrigger className="w-40 bg-card"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Classes</SelectItem>
                        {classes.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.name}{c.section ? ` (${c.section})` : ''}</SelectItem>
                        ))}
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
                <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="w-32 bg-card"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {STATUSES.map((s) => <SelectItem key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</SelectItem>)}
                    </SelectContent>
                </Select>
                {(search || classId !== 'all' || month !== 'All' || year !== 'All' || status !== 'All') && (
                    <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setClassId('all'); setMonth('All'); setYear('All'); setStatus('All'); }}>
                        Clear
                    </Button>
                )}
            </div>

            {/* Table */}
            <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-muted/40 border-b border-border">
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Challan No.</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Student</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Class</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Month / Year</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Due Date</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Amount</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Status</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredByClass.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground text-sm">
                                    No challans found for the selected filters.
                                </td>
                            </tr>
                        ) : (
                            filteredByClass.map((c) => (
                                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{c.challanNumber}</td>
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-foreground">{c.student.name}</div>
                                        <div className="text-xs text-muted-foreground">{c.student.rollNumber}</div>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {c.student.class
                                            ? `${c.student.class.name}${c.student.class.section ? ` (${c.student.class.section})` : ''}`
                                            : '—'}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">{c.month} {c.year}</td>
                                    <td className="px-4 py-3 text-muted-foreground tabular-nums">
                                        {format(new Date(c.dueDate), 'dd MMM yyyy')}
                                    </td>
                                    <td className="px-4 py-3 text-right font-medium tabular-nums text-foreground">
                                        {fmt(Number(c.totalAmount))}
                                        {c.status === 'Paid' && Number(c.paidAmount) !== Number(c.totalAmount) && (
                                            <div className="text-xs text-muted-foreground">Paid: {fmt(Number(c.paidAmount))}</div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-center">{statusBadge(c.status)}</td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end gap-1">
                                            {(c.status === 'Pending' || c.status === 'Overdue') && (
                                                <>
                                                    <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={() => openMarkPaid(c)}>
                                                        Mark Paid
                                                    </Button>
                                                    <Link href={`/school/finance/challan/${c.id}/edit`}>
                                                        <Button size="sm" variant="ghost" className="h-7 text-xs px-2 text-muted-foreground">
                                                            Edit
                                                        </Button>
                                                    </Link>
                                                    <Button size="sm" variant="ghost" className="h-7 text-xs px-2 text-muted-foreground" onClick={() => handleCancel(c.id, c.challanNumber)}>
                                                        Cancel
                                                    </Button>
                                                </>
                                            )}
                                            <Link href={`/school/finance/challan/${c.id}/print`} target="_blank">
                                                <Button size="sm" variant="ghost" className="h-7 text-xs px-2 text-muted-foreground">
                                                    <Printer className="h-3.5 w-3.5" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <BulkPrintDialog
                open={bulkPrintOpen}
                onClose={() => setBulkPrintOpen(false)}
                students={students}
                classes={classes}
                availableYears={years.filter(y => y !== 'All')}
            />

            {/* Mark Paid Dialog */}
            <Dialog open={!!markingChallan} onOpenChange={(open) => !open && setMarkingChallan(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Record Fee Payment</DialogTitle>
                    </DialogHeader>
                    {markingChallan && (() => {
                        const alreadyPaid = Number(markingChallan.paidAmount);
                        const total = Number(markingChallan.totalAmount);
                        const remaining = total - alreadyPaid;
                        const enteredAmount = parseFloat(paidAmount) || 0;
                        const afterPayment = alreadyPaid + enteredAmount;
                        const willBeFullyPaid = afterPayment >= total;
                        return (
                            <div className="space-y-4 pt-2">
                                <div className="bg-muted/50 rounded-lg px-4 py-3 text-sm space-y-1">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Student</span>
                                        <span className="font-medium">{markingChallan.student.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Challan</span>
                                        <span className="font-mono text-xs">{markingChallan.challanNumber}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Period</span>
                                        <span>{markingChallan.month} {markingChallan.year}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Total Due</span>
                                        <span className="font-semibold">{fmt(total)}</span>
                                    </div>
                                    {alreadyPaid > 0 && (
                                        <div className="flex justify-between text-emerald-600">
                                            <span>Previously Paid</span>
                                            <span>{fmt(alreadyPaid)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between font-semibold border-t border-border pt-1 mt-1">
                                        <span>Remaining Balance</span>
                                        <span>{fmt(remaining)}</span>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label>Amount Being Paid Now</Label>
                                    <Input
                                        type="number"
                                        value={paidAmount}
                                        onChange={(e) => setPaidAmount(e.target.value)}
                                        min="1"
                                        max={remaining}
                                    />
                                    {enteredAmount > 0 && (
                                        <p className={`text-xs ${willBeFullyPaid ? 'text-emerald-600' : 'text-amber-600'}`}>
                                            {willBeFullyPaid
                                                ? 'This will fully clear the challan.'
                                                : `Rs ${(total - afterPayment).toFixed(0)} will remain outstanding — challan stays pending.`}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Payment Method</Label>
                                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Cash">Cash</SelectItem>
                                            <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                                            <SelectItem value="Cheque">Cheque</SelectItem>
                                            <SelectItem value="Online">Online</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Payment Date</Label>
                                    <Input type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} />
                                </div>

                                <div className="flex justify-end gap-2 pt-2">
                                    <Button variant="outline" onClick={() => setMarkingChallan(null)}>Cancel</Button>
                                    <Button onClick={submitMarkPaid} disabled={isPending || !paidAmount || enteredAmount <= 0}>
                                        {isPending ? 'Saving…' : 'Confirm Payment'}
                                    </Button>
                                </div>
                            </div>
                        );
                    })()}
                </DialogContent>
            </Dialog>

            {/* Post-payment print prompt */}
            <Dialog open={!!printPrompt} onOpenChange={(open) => !open && setPrintPrompt(null)}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Payment Recorded</DialogTitle>
                    </DialogHeader>
                    {printPrompt && (
                        <div className="space-y-4 pt-2">
                            <p className="text-sm text-muted-foreground">{printPrompt.message}</p>
                            <p className="text-sm">Would you like to print this challan?</p>
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setPrintPrompt(null)}>
                                    No, dismiss
                                </Button>
                                <Button onClick={() => {
                                    window.open(`/school/finance/challan/${printPrompt.challanId}/print`, '_blank');
                                    setPrintPrompt(null);
                                }}>
                                    <Printer className="h-4 w-4 mr-1.5" />
                                    Print Challan
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
