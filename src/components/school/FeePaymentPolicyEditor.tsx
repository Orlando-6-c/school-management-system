'use client';

import { useState, useTransition } from 'react';
import { updateFeePaymentPolicy } from '@/actions/settings';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

const DEFAULT_POLICY = `1. Fee is due by the due date shown on this challan. Late payments may attract additional charges.
2. Fee once paid is non-refundable under any circumstances.
3. Always obtain a receipt from the cashier after payment.
4. Payments must be made to the designated bank account only. The school is not responsible for payments made to any other account.
5. For queries regarding fee, contact the school accounts office during working hours.`;

export default function FeePaymentPolicyEditor({ initialPolicy }: { initialPolicy: string | null }) {
    const [policy, setPolicy] = useState(initialPolicy ?? '');
    const [isPending, startTransition] = useTransition();
    const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

    function handleSave() {
        setMsg(null);
        startTransition(async () => {
            const res = await updateFeePaymentPolicy(policy);
            setMsg({ ok: !!res.success, text: res.success ? 'Policy saved.' : (res.message ?? 'Failed.') });
            setTimeout(() => setMsg(null), 3000);
        });
    }

    function handleReset() {
        setPolicy(DEFAULT_POLICY);
    }

    return (
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <div>
                <h2 className="text-lg font-semibold text-foreground">Fee Payment Policy</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                    This text is printed at the bottom of every fee challan. Leave blank to use the default.
                </p>
            </div>

            <div className="space-y-1.5">
                <Label>Policy Text</Label>
                <textarea
                    value={policy}
                    onChange={e => setPolicy(e.target.value)}
                    rows={6}
                    placeholder={DEFAULT_POLICY}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
                />
                <p className="text-xs text-muted-foreground">Each line is printed as a separate rule on the challan.</p>
            </div>

            <div className="flex items-center gap-3">
                <Button size="sm" onClick={handleSave} disabled={isPending}>
                    {isPending ? 'Saving…' : 'Save Policy'}
                </Button>
                <Button size="sm" variant="outline" onClick={handleReset} type="button">
                    Reset to Default
                </Button>
                {msg && (
                    <p className={`text-xs ${msg.ok ? 'text-emerald-600' : 'text-destructive'}`}>{msg.text}</p>
                )}
            </div>
        </div>
    );
}
