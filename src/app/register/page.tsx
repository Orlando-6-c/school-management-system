import Link from 'next/link';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { RegisterForm } from '@/components/RegisterForm';
import { School } from 'lucide-react';

export const runtime = 'nodejs';

export default async function RegisterPage() {
    const session = await getSession();
    if (session.userId) {
        redirect(session.isSuperAdmin ? '/admin' : '/dashboard');
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center p-4">
            <div className="w-full max-w-lg">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl backdrop-blur mb-4">
                        <School className="h-9 w-9 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white">Start your free trial</h1>
                    <p className="text-white/70 mt-2">Set up your school in under a minute.</p>
                </div>

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-2xl p-8">
                    <RegisterForm />
                </div>

                <p className="text-center text-white/70 text-sm mt-6">
                    Already have an account?{' '}
                    <Link href="/login" className="text-white font-semibold hover:underline">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}
