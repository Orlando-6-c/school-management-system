'use client';

import { useActionState } from 'react';
import { updateSuperAdminCredentials } from '@/actions/super-admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle2 } from 'lucide-react';

export default function SettingsPage() {
    const [state, action, pending] = useActionState(updateSuperAdminCredentials, undefined);

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Settings</h1>
            <p className="text-gray-600 mb-8">Manage your account security.</p>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-6">Update Credentials</h2>

                {state?.success && (
                    <div className="bg-green-50 text-green-700 p-4 rounded-lg flex items-center mb-6">
                        <CheckCircle2 className="mr-2 h-5 w-5" />
                        Credentials updated successfully!
                    </div>
                )}

                {state?.message && !state.success && (
                    <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 text-sm">
                        {state.message}
                    </div>
                )}

                <form action={action} className="space-y-6">
                    <div className="grid gap-2">
                        <Label htmlFor="currentPassword">Current Password (Required)</Label>
                        <Input
                            id="currentPassword"
                            name="currentPassword"
                            type="password"
                            required
                            className="text-gray-900"
                        />
                        {state?.errors?.currentPassword && (
                            <p className="text-red-600 text-xs">{state.errors.currentPassword[0]}</p>
                        )}
                    </div>

                    <div className="border-t border-gray-100 my-4"></div>

                    <div className="grid gap-2">
                        <Label htmlFor="newUsername">New Username (Optional)</Label>
                        <Input
                            id="newUsername"
                            name="newUsername"
                            placeholder="Leave blank to keep current"
                            className="text-gray-900"
                        />
                        {state?.errors?.newUsername && (
                            <p className="text-red-600 text-xs">{state.errors.newUsername[0]}</p>
                        )}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="newPassword">New Password (Optional)</Label>
                        <Input
                            id="newPassword"
                            name="newPassword"
                            type="password"
                            placeholder="Leave blank to keep current"
                            className="text-gray-900"
                        />
                        {state?.errors?.newPassword && (
                            <p className="text-red-600 text-xs">{state.errors.newPassword[0]}</p>
                        )}
                    </div>

                    <div className="pt-4 flex justify-end">
                        <Button type="submit" disabled={pending}>
                            {pending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                'Update Credentials'
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
