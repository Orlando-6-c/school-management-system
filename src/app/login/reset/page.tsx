'use client';

export const runtime = 'nodejs';

import { useActionState } from 'react';
import { requestPasswordReset } from '@/actions/password-reset';
import Link from 'next/link';
import { School } from 'lucide-react';

export default function ResetRequestPage() {
    const [state, action, pending] = useActionState(requestPasswordReset, undefined);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-700 via-purple-700 to-indigo-800 p-4">
            <div className="w-full max-w-md bg-card/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-8">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-white/10 rounded-xl mb-4">
                        <School className="h-6 w-6 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Forgot Password?</h1>
                    <p className="text-white/70 text-sm mt-1">Enter the email on your account and we'll send a reset link.</p>
                </div>

                {state?.success ? (
                    <div className="bg-green-500/20 border border-green-400/30 rounded-lg p-4 text-green-200 text-sm text-center">
                        {state.message}
                    </div>
                ) : (
                    <form action={action} className="space-y-4">
                        {state?.message && (
                            <div className="bg-red-500/20 border border-red-400/30 rounded-lg p-3 text-red-200 text-sm text-center">
                                {state.message}
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-white/90 mb-1">Email Address</label>
                            <input
                                name="email"
                                type="email"
                                required
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
                                placeholder="you@example.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-white/90 mb-1">
                                School Slug <span className="text-white/50 font-normal">(optional)</span>
                            </label>
                            <input
                                name="schoolSlug"
                                type="text"
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
                                placeholder="e.g. sunrise-academy"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={pending}
                            className="w-full py-3 bg-white/90 text-violet-800 font-bold rounded-lg hover:bg-white transition-colors disabled:opacity-50"
                        >
                            {pending ? 'Sending…' : 'Send Reset Link'}
                        </button>
                    </form>
                )}

                <p className="text-center text-white/60 text-sm mt-6">
                    <Link href="/login" className="text-white font-semibold hover:underline">← Back to Sign In</Link>
                </p>
            </div>
        </div>
    );
}
