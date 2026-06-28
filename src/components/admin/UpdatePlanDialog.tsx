'use client';

import { useState, useActionState, startTransition } from 'react';
import { updateSchoolPlan } from '@/actions/subscription';
import { PLANS } from '@/lib/plans';
import { Settings2 } from 'lucide-react';

interface UpdatePlanDialogProps {
    schoolId: string;
    schoolName: string;
    currentPlan: string;
    currentStatus: string;
    currentNotes: string;
}

export function UpdatePlanDialog({ schoolId, schoolName, currentPlan, currentStatus, currentNotes }: UpdatePlanDialogProps) {
    const [open, setOpen] = useState(false);
    const [state, formAction, pending] = useActionState(updateSchoolPlan, undefined);

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
            >
                <Settings2 className="h-3.5 w-3.5" />
                Change plan
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
                    <div className="relative bg-card rounded-2xl shadow-2xl border border-border w-full max-w-md p-6 space-y-5">
                        <div>
                            <h2 className="text-lg font-bold text-foreground">Update Plan</h2>
                            <p className="text-sm text-muted-foreground mt-0.5">{schoolName}</p>
                        </div>

                        {state?.message && (
                            <div className={`rounded-lg p-3 text-sm ${state.success ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                                {state.message}
                            </div>
                        )}

                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                const fd = new FormData(e.currentTarget);
                                startTransition(() => formAction(fd));
                            }}
                            className="space-y-4"
                        >
                            <input type="hidden" name="schoolId" value={schoolId} />

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Plan</label>
                                <select
                                    name="plan"
                                    defaultValue={currentPlan}
                                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                >
                                    {(Object.keys(PLANS) as (keyof typeof PLANS)[]).map((tier) => (
                                        <option key={tier} value={tier}>
                                            {PLANS[tier].label}
                                            {PLANS[tier].pricePerMonth
                                                ? ` — Rs ${PLANS[tier].pricePerMonth?.toLocaleString()}/mo`
                                                : tier === 'Trial'
                                                    ? ' (Free)'
                                                    : ' (Custom)'}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Status</label>
                                <select
                                    name="status"
                                    defaultValue={currentStatus}
                                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                >
                                    <option value="Trial">Trial</option>
                                    <option value="Active">Active</option>
                                    <option value="Expired">Expired</option>
                                    <option value="Cancelled">Cancelled</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">
                                    Period (months) <span className="text-muted-foreground font-normal">(when setting Active)</span>
                                </label>
                                <input
                                    name="periodMonths"
                                    type="number"
                                    min={1}
                                    max={36}
                                    defaultValue={1}
                                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">
                                    Notes <span className="text-muted-foreground font-normal">(internal)</span>
                                </label>
                                <textarea
                                    name="notes"
                                    defaultValue={currentNotes}
                                    rows={2}
                                    placeholder="e.g. paid via bank transfer on 2026-07-01"
                                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-1">
                                <button
                                    type="button"
                                    onClick={() => setOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={pending}
                                    className="px-5 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                                >
                                    {pending ? 'Saving…' : 'Save changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
