'use client';

import { useState, useTransition } from 'react';
import { deleteAdditionalCharge } from '@/actions/finance';
import { Trash2 } from 'lucide-react';

interface AdditionalCharge {
    id: string;
    name: string;
    type: string;
    amount: number;
    applicableMonths: string[];
    incomeCategory: string;
    resolvedStudents: { id: string; name: string; rollNumber: string }[];
    resolvedClasses: { id: string; name: string; section: string | null }[];
}

export default function AdditionalChargesTable({ additionalCharges }: { additionalCharges: AdditionalCharge[] }) {
    const [local, setLocal] = useState(additionalCharges);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    function handleDelete(id: string, name: string) {
        if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
        setDeleting(id);
        startTransition(async () => {
            const res = await deleteAdditionalCharge(id);
            if (res.success) {
                setLocal(prev => prev.filter(c => c.id !== id));
            } else {
                alert(res.message);
            }
            setDeleting(null);
        });
    }

    function fmt(n: number) {
        return 'Rs ' + Number(n).toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    }

    return (
        <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
                <thead>
                    <tr className="bg-muted/40 border-b border-border">
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Charge Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Applies To</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Month(s)</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Category</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Amount</th>
                        <th className="px-4 py-3" />
                    </tr>
                </thead>
                <tbody>
                    {local.length === 0 ? (
                        <tr>
                            <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground text-sm">
                                No additional charges defined yet.
                            </td>
                        </tr>
                    ) : (
                        local.map(charge => (
                            <tr key={charge.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                                <td className="px-4 py-3 font-medium text-foreground">{charge.name}</td>
                                <td className="px-4 py-3">
                                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${charge.type === 'OneTime' ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' : 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'}`}>
                                        {charge.type === 'OneTime' ? 'One-Time' : 'Recurring'}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-muted-foreground text-xs max-w-[200px]">
                                    {charge.resolvedStudents.length === 0 && charge.resolvedClasses.length === 0 ? (
                                        <span className="text-foreground">All Students</span>
                                    ) : (
                                        <div className="space-y-0.5">
                                            {charge.resolvedClasses.map(c => (
                                                <div key={c.id}>{c.name}{c.section ? ` (${c.section})` : ''}</div>
                                            ))}
                                            {charge.resolvedStudents.map(s => (
                                                <div key={s.id}>{s.name} ({s.rollNumber})</div>
                                            ))}
                                        </div>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-muted-foreground text-xs">
                                    {charge.applicableMonths.length > 0
                                        ? charge.applicableMonths.join(', ')
                                        : <span className="text-destructive/70">No month set</span>}
                                </td>
                                <td className="px-4 py-3 text-muted-foreground">{charge.incomeCategory}</td>
                                <td className="px-4 py-3 text-right font-medium tabular-nums text-foreground">{fmt(charge.amount)}</td>
                                <td className="px-4 py-3 text-right">
                                    <button
                                        onClick={() => handleDelete(charge.id, charge.name)}
                                        disabled={deleting === charge.id || isPending}
                                        className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
