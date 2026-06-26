'use client';

import { useActionState, useTransition } from 'react';
import { addBankAccount, deleteBankAccount } from '@/actions/settings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Trash2 } from 'lucide-react';

interface BankAccountsManagerProps {
    bankAccounts: any[];
}

export default function BankAccountsManager({ bankAccounts }: BankAccountsManagerProps) {
    const [state, action, isPending] = useActionState(addBankAccount, undefined);
    const [isDeleting, startTransition] = useTransition();

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this bank account?')) {
            startTransition(async () => {
                await deleteBankAccount(id);
            });
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Bank Accounts</CardTitle>
                <CardDescription>Manage the bank accounts where parents can send fee payments.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* List of existing accounts */}
                {bankAccounts && bankAccounts.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                        {bankAccounts.map((acc) => (
                            <div key={acc.id} className="p-4 border border-slate-200 rounded-lg bg-slate-50 relative group">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => handleDelete(acc.id)}
                                    disabled={isDeleting}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{acc.bankName}</div>
                                <div className="font-bold text-slate-800 text-sm">{acc.accountTitle}</div>
                                <div className="font-mono text-xs text-slate-600 mt-1">{acc.accountNumber}</div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-sm text-muted-foreground p-6 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
                        No bank accounts setup. Add one below.
                    </div>
                )}

                <div className="pt-6 border-t border-border mt-6">
                    <h3 className="text-sm font-bold text-slate-800 mb-4">Add New Account</h3>

                    {state?.message && (
                        <div className={`p-3 rounded-lg text-sm mb-4 font-medium ${state.success ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                            {state.message}
                        </div>
                    )}

                    <form action={action} className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-3">
                            <div className="space-y-2">
                                <Label htmlFor="bankName">Bank Name</Label>
                                <Input id="bankName" name="bankName" placeholder="e.g. Chase Bank" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="accountTitle">Account Title</Label>
                                <Input id="accountTitle" name="accountTitle" placeholder="e.g. School Official" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="accountNumber">Account No. / IBAN</Label>
                                <Input id="accountNumber" name="accountNumber" placeholder="e.g. PK00..." required />
                            </div>
                        </div>
                        <Button type="submit" disabled={isPending}>
                            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Add Account
                        </Button>
                    </form>
                </div>
            </CardContent>
        </Card>
    );
}
