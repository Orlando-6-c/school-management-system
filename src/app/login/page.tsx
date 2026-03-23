'use client';

export const runtime = 'nodejs';

import { useActionState, Suspense } from 'react';
import { login } from '@/actions/auth';
import { useSearchParams } from 'next/navigation';

function LoginForm() {
    const [state, action, pending] = useActionState(login, undefined);
    const searchParams = useSearchParams();
    const schoolSlug = searchParams.get('school'); // Optional pre-fill

    return (
        <form action={action} className="space-y-6">
            {state?.message && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-200 text-sm text-center">
                    {state.message}
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-white/90 mb-1">
                    Username
                </label>
                <input
                    name="username"
                    type="text"
                    required
                    className="w-full px-4 py-2 bg-card/5 border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
                    placeholder="Enter your username"
                />
                {state?.errors?.username && (
                    <p className="text-red-300 text-xs mt-1">{state.errors.username[0]}</p>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium text-white/90 mb-1">
                    Password
                </label>
                <input
                    name="password"
                    type="password"
                    required
                    className="w-full px-4 py-2 bg-card/5 border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
                    placeholder="••••••••"
                />
                {state?.errors?.password && (
                    <p className="text-red-300 text-xs mt-1">{state.errors.password[0]}</p>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium text-white/90 mb-1">
                    School Slug (Optional)
                </label>
                <input
                    name="schoolSlug"
                    type="text"
                    defaultValue={schoolSlug ?? ''}
                    className="w-full px-4 py-2 bg-card/5 border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
                    placeholder="e.g. demo-school"
                />
                <p className="text-xs text-white/60 mt-1">Leave empty for Super Admin</p>
                {state?.errors?.schoolSlug && (
                    <p className="text-red-300 text-xs mt-1">{state.errors.schoolSlug[0]}</p>
                )}
            </div>

            <button
                type="submit"
                disabled={pending}
                className="w-full py-3 px-4 bg-card text-primary font-bold rounded-lg hover:bg-card/90 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {pending ? 'Signing in...' : 'Sign In'}
            </button>
        </form>
    );
}

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
            <div className="w-full max-w-md bg-card/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl overflow-hidden p-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
                    <p className="text-white/80">Sign in to your account</p>
                </div>
                <Suspense fallback={<div className="text-white text-center">Loading...</div>}>
                    <LoginForm />
                </Suspense>
            </div>
        </div>
    );
}
