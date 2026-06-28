import { confirmPasswordReset } from '@/actions/password-reset';
import db from '@/lib/db';
import Link from 'next/link';
import { School } from 'lucide-react';
import { TokenResetForm } from './token-form';

export const runtime = 'nodejs';

export default async function ResetTokenPage({
    params,
}: {
    params: Promise<{ token: string }>;
}) {
    const { token } = await params;

    const resetToken = await db.passwordResetToken.findUnique({ where: { token } });
    const isValid = !!resetToken && !resetToken.usedAt && resetToken.expiresAt > new Date();

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-700 via-purple-700 to-indigo-800 p-4">
            <div className="w-full max-w-md bg-card/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-8">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-white/10 rounded-xl mb-4">
                        <School className="h-6 w-6 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Set New Password</h1>
                </div>

                {isValid ? (
                    <TokenResetForm token={token} />
                ) : (
                    <div className="text-center space-y-4">
                        <div className="bg-red-500/20 border border-red-400/30 rounded-lg p-4 text-red-200 text-sm">
                            This reset link is invalid or has expired.
                        </div>
                        <Link href="/login/reset" className="inline-block text-white font-semibold hover:underline text-sm">
                            Request a new link →
                        </Link>
                    </div>
                )}

                <p className="text-center text-white/60 text-sm mt-6">
                    <Link href="/login" className="text-white font-semibold hover:underline">← Back to Sign In</Link>
                </p>
            </div>
        </div>
    );
}
