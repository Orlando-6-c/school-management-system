'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Trash2 } from 'lucide-react';
import { addChallanLineItem, removeChallanLineItem, updateChallanDetails } from '@/actions/finance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface LineItem { id: string; description: string; amount: number }

interface Challan {
    id: string;
    challanNumber: string;
    month: string;
    year: number;
    status: string;
    dueDate: string;
    remarks: string | null;
    totalAmount: number;
    student: {
        name: string;
        rollNumber: string;
        class: { name: string; section: string | null } | null;
    };
    feeBreakdown: LineItem[];
}

function fmt(n: number) {
    return 'Rs ' + Number(n).toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function statusBadge(status: string) {
    const map: Record<string, string> = {
        Paid:      'bg-emerald-50 text-emerald-700',
        Pending:   'bg-amber-50 text-amber-700',
        Overdue:   'bg-red-50 text-red-700',
        Cancelled: 'bg-muted text-muted-foreground',
    };
    return (
        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${map[status] ?? 'bg-muted text-muted-foreground'}`}>
            {status}
        </span>
    );
}

export default function ChallanEditClient({ challan }: { challan: Challan }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const editable = challan.status !== 'Paid' && challan.status !== 'Cancelled';

    // Local state so UI updates instantly without a full reload
    const [items, setItems] = useState<LineItem[]>(challan.feeBreakdown);
    const [total, setTotal] = useState(challan.totalAmount);
    const [dueDate, setDueDate] = useState(new Date(challan.dueDate).toISOString().split('T')[0]);
    const [remarks, setRemarks] = useState(challan.remarks ?? '');

    // New item form
    const [newDesc, setNewDesc] = useState('');
    const [newAmount, setNewAmount] = useState('');
    const [addError, setAddError] = useState<string | null>(null);
    const [saveMsg, setSaveMsg] = useState<string | null>(null);

    function handleAddItem() {
        const amt = parseFloat(newAmount);
        if (!newDesc.trim() || isNaN(amt) || amt <= 0) {
            setAddError('Enter a description and a positive amount.');
            return;
        }
        setAddError(null);
        startTransition(async () => {
            const res = await addChallanLineItem(challan.id, newDesc.trim(), amt);
            if (res.success && res.item) {
                setItems(prev => [...prev, res.item as LineItem]);
                setTotal(prev => prev + amt);
                setNewDesc('');
                setNewAmount('');
            } else {
                setAddError(res.message ?? 'Failed to add item.');
            }
        });
    }

    function handleRemoveItem(item: LineItem) {
        startTransition(async () => {
            const res = await removeChallanLineItem(challan.id, item.id);
            if (res.success) {
                setItems(prev => prev.filter(i => i.id !== item.id));
                setTotal(prev => prev - item.amount);
            } else {
                alert(res.message);
            }
        });
    }

    function handleSaveDetails() {
        setSaveMsg(null);
        startTransition(async () => {
            const res = await updateChallanDetails(challan.id, new Date(dueDate), remarks);
            if (res.success) {
                setSaveMsg('Saved.');
                setTimeout(() => setSaveMsg(null), 2000);
            } else {
                setSaveMsg(res.message ?? 'Failed to save.');
            }
        });
    }

    return (
        <div className="space-y-6 max-w-2xl">
            {/* Read-only header */}
            <div className="bg-muted/40 border border-border rounded-lg px-5 py-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                    <p className="text-xs text-muted-foreground">Challan / PSID</p>
                    <p className="font-mono font-semibold">{challan.challanNumber}</p>
                </div>
                <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    {statusBadge(challan.status)}
                </div>
                <div>
                    <p className="text-xs text-muted-foreground">Student</p>
                    <p className="font-medium">{challan.student.name} <span className="text-muted-foreground font-normal">({challan.student.rollNumber})</span></p>
                </div>
                <div>
                    <p className="text-xs text-muted-foreground">Class</p>
                    <p className="font-medium">
                        {challan.student.class
                            ? `${challan.student.class.name}${challan.student.class.section ? ` (${challan.student.class.section})` : ''}`
                            : '—'}
                    </p>
                </div>
                <div>
                    <p className="text-xs text-muted-foreground">Period</p>
                    <p className="font-medium">{challan.month} {challan.year}</p>
                </div>
            </div>

            {!editable && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
                    This challan is {challan.status.toLowerCase()} and cannot be edited.
                </div>
            )}

            {/* Fee Breakdown */}
            <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">Fee Breakdown</p>
                <div className="border border-border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-muted/40 border-b border-border">
                                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Description</th>
                                <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Amount</th>
                                {editable && <th className="px-3 py-2.5 w-10" />}
                            </tr>
                        </thead>
                        <tbody>
                            {items.length === 0 ? (
                                <tr>
                                    <td colSpan={editable ? 3 : 2} className="px-4 py-6 text-center text-muted-foreground text-xs">
                                        No line items.
                                    </td>
                                </tr>
                            ) : (
                                items.map(item => (
                                    <tr key={item.id} className="border-b border-border last:border-0">
                                        <td className="px-4 py-2.5 text-foreground">{item.description}</td>
                                        <td className={`px-4 py-2.5 text-right tabular-nums font-medium ${item.amount < 0 ? 'text-emerald-600' : ''}`}>
                                            {item.amount < 0
                                                ? `(${fmt(Math.abs(item.amount))})`
                                                : fmt(item.amount)}
                                        </td>
                                        {editable && (
                                            <td className="px-3 py-2.5 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveItem(item)}
                                                    disabled={isPending}
                                                    className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                        <tfoot>
                            <tr className="border-t-2 border-border bg-muted/20">
                                <td className="px-4 py-2.5 font-semibold text-sm">Total</td>
                                <td className="px-4 py-2.5 text-right font-bold tabular-nums">{fmt(total)}</td>
                                {editable && <td />}
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Add line item */}
                {editable && (
                    <div className="border border-dashed border-border rounded-lg px-4 py-3 space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Add charge</p>
                        <div className="flex gap-2">
                            <Input
                                placeholder="Description (e.g. Annual Registration Fee)"
                                value={newDesc}
                                onChange={e => setNewDesc(e.target.value)}
                                className="flex-1 h-8 text-sm"
                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddItem())}
                            />
                            <Input
                                type="number"
                                placeholder="Amount"
                                value={newAmount}
                                onChange={e => setNewAmount(e.target.value)}
                                className="w-32 h-8 text-sm"
                                min="1"
                                step="0.01"
                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddItem())}
                            />
                            <Button
                                type="button"
                                size="sm"
                                className="h-8 shrink-0"
                                onClick={handleAddItem}
                                disabled={isPending}
                            >
                                Add
                            </Button>
                        </div>
                        {addError && <p className="text-xs text-destructive">{addError}</p>}
                    </div>
                )}
            </div>

            {/* Due date + Remarks */}
            {editable && (
                <div className="border border-border rounded-lg px-5 py-4 space-y-4">
                    <p className="text-sm font-medium text-foreground">Challan Details</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs">Due Date</Label>
                            <Input
                                type="date"
                                value={dueDate}
                                onChange={e => setDueDate(e.target.value)}
                                className="h-8 text-sm"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">Remarks <span className="text-muted-foreground font-normal">(optional)</span></Label>
                            <Input
                                value={remarks}
                                onChange={e => setRemarks(e.target.value)}
                                placeholder="e.g. Partial payment arrangement"
                                className="h-8 text-sm"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button type="button" size="sm" onClick={handleSaveDetails} disabled={isPending}>
                            {isPending ? 'Saving…' : 'Save Details'}
                        </Button>
                        {saveMsg && (
                            <p className={`text-xs ${saveMsg === 'Saved.' ? 'text-emerald-600' : 'text-destructive'}`}>
                                {saveMsg}
                            </p>
                        )}
                    </div>
                </div>
            )}

            <div className="flex gap-3 pt-1">
                <Button variant="outline" size="sm" onClick={() => router.push('/school/finance/challan')}>
                    Back to Challans
                </Button>
            </div>
        </div>
    );
}
