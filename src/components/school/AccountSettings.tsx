'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { resetUserPassword } from '@/actions/auth-management';

interface AccountSettingsProps {
    targetType: 'Student' | 'Teacher' | 'Staff';
    targetId: string;
    hasAccount: boolean;
    isActive: boolean;
    username?: string;
}

export function AccountSettings({ targetType, targetId, hasAccount, isActive, username }: AccountSettingsProps) {
    const [isPending, startTransition] = useTransition();
    const [tempPassword, setTempPassword] = useState<string | null>(null);

    const handleReset = async () => {
        if (!confirm(`Are you sure you want to reset the password for this ${targetType}?`)) return;

        startTransition(async () => {
            const result = await resetUserPassword(targetType, targetId);
            if (result.success) {
                setTempPassword(result.tempPassword ?? null);
            } else {
                alert(result.message || 'Failed to reset password');
            }
        });
    };

    return (
        <Card className="mt-6 border-border shadow-sm">
            <CardHeader>
                <CardTitle className="text-foreground">Authentication Settings</CardTitle>
                <CardDescription>Manage the system login account for this profile.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <span className="font-semibold text-sm mr-2 text-foreground">Status:</span>
                        {!hasAccount ? (
                            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground">No Linked Account</span>
                        ) : isActive ? (
                            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-green-600 text-white hover:bg-green-700 cursor-default">Active</span>
                        ) : (
                            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-destructive text-destructive-foreground hover:bg-destructive/80">Inactive</span>
                        )}
                        {username && <p className="text-xs text-muted-foreground mt-2">Login Username: <strong>{username}</strong></p>}
                    </div>

                    {hasAccount && (
                        <Button
                            variant="outline"
                            onClick={handleReset}
                            disabled={isPending || !isActive}
                            className={`border-indigo-600 text-indigo-600 hover:bg-indigo-50 ${isPending ? 'opacity-50' : ''}`}
                        >
                            {isPending ? "Resetting..." : "Reset Password"}
                        </Button>
                    )}
                </div>

                {tempPassword && (
                    <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-md">
                        <p className="text-sm font-semibold text-indigo-900">Password Reset Successful!</p>
                        <p className="text-sm text-indigo-800 mt-1">
                            The new temporary password is: <strong className="font-mono text-lg bg-white border border-indigo-300 px-3 py-1 ml-2 select-all rounded">{tempPassword}</strong>
                        </p>
                        <p className="text-xs text-indigo-600 mt-2">Please copy this and securely hand it back to the user. This will not be shown again.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
