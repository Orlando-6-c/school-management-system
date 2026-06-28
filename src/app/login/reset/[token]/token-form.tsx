'use client';

import { useActionState } from 'react';
import { confirmPasswordReset } from '@/actions/password-reset';

export function TokenResetForm({ token }: { token: string }) {
    const action = confirmPasswordReset.bind(null, token);
    const [state, formAction, pending] = useActionState(action, undefined);

    return (
        <form action={formAction} className="space-y-4">
            {state?.message && (
                <div className="bg-red-500/20 border border-red-400/30 rounded-lg p-3 text-red-200 text-sm text-center">
                    {state.message}
                </div>
            )}
            <div>
                <label className="block text-sm font-medium text-white/90 mb-1">New Password</label>
                <input
                    name="password"
                    type="password"
                    required
                    minLength={8}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
                    placeholder="Min. 8 characters"
                />
                {state?.errors?.password && (
                    <p className="text-red-300 text-xs mt-1">{state.errors.password[0]}</p>
                )}
            </div>
            <div>
                <label className="block text-sm font-medium text-white/90 mb-1">Confirm Password</label>
                <input
                    name="confirmPassword"
                    type="password"
                    required
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
                    placeholder="Re-enter your password"
                />
                {state?.errors?.confirmPassword && (
                    <p className="text-red-300 text-xs mt-1">{state.errors.confirmPassword[0]}</p>
                )}
            </div>
            <button
                type="submit"
                disabled={pending}
                className="w-full py-3 bg-white/90 text-violet-800 font-bold rounded-lg hover:bg-white transition-colors disabled:opacity-50"
            >
                {pending ? 'Saving…' : 'Set New Password'}
            </button>
        </form>
    );
}
