'use client';

import { useActionState } from 'react';
import { changeOwnPassword, type ChangePasswordState } from '@/actions/auth-management';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function ChangePasswordForm() {
    const [state, action, isPending] = useActionState<ChangePasswordState | undefined, FormData>(
        changeOwnPassword,
        undefined,
    );

    return (
        <form action={action} className="space-y-4">
            {state?.success && (
                <p className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-md px-3 py-2">
                    {state.message}
                </p>
            )}
            {state?.message && !state.success && (
                <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                    {state.message}
                </p>
            )}

            <div className="space-y-1.5">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" />
                {state?.errors?.currentPassword && (
                    <p className="text-xs text-destructive">{state.errors.currentPassword[0]}</p>
                )}
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="newPassword">New Password</Label>
                <Input id="newPassword" name="newPassword" type="password" autoComplete="new-password" />
                {state?.errors?.newPassword && (
                    <p className="text-xs text-destructive">{state.errors.newPassword[0]}</p>
                )}
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" />
                {state?.errors?.confirmPassword && (
                    <p className="text-xs text-destructive">{state.errors.confirmPassword[0]}</p>
                )}
            </div>

            <Button type="submit" disabled={isPending} className="w-full">
                {isPending ? 'Saving…' : 'Change Password'}
            </Button>
        </form>
    );
}
