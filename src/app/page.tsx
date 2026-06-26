import Link from 'next/link';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import {
    GraduationCap,
    DollarSign,
    Users,
    ClipboardList,
    BarChart3,
    ShieldCheck,
    ArrowRight,
    School,
    BookOpen,
    CheckCircle2,
} from 'lucide-react';

export const runtime = 'nodejs';

const features = [
    { icon: GraduationCap, title: 'Student Management', desc: 'Enroll, promote, and track every student with roll numbers, class assignments, and full profiles.' },
    { icon: DollarSign, title: 'Fee & Finance', desc: 'Generate challans, record payments and expenses, manage salary slips, and track income vs. expenditure.' },
    { icon: Users, title: 'Staff & Teachers', desc: 'Manage teaching and non-teaching staff, assign subjects, set working hours, and link system logins.' },
    { icon: ClipboardList, title: 'Attendance', desc: 'Teachers mark daily attendance from their portal. Admins see class-wide summaries and date-range reports.' },
    { icon: BookOpen, title: 'Academics', desc: 'Timetables, homework assignments, study materials, exam results, and class promotions — all in one place.' },
    { icon: BarChart3, title: 'Reports', desc: 'Fee collection, defaulters, income vs. expense, and salary register reports — print-ready with one click.' },
    { icon: ShieldCheck, title: 'Role-Based Access', desc: 'Owner, Accountant, Teacher, Customer Rep — granular action-level permissions per user, customisable.' },
    { icon: School, title: 'Multi-Tenant SaaS', desc: 'Each school is fully isolated. One platform, unlimited schools, zero data bleed between tenants.' },
];

export default async function LandingPage() {
    const session = await getSession();
    if (session.userId) {
        redirect(session.isSuperAdmin ? '/admin' : '/dashboard');
    }

    return (
        <div className="flex flex-col min-h-screen bg-white">
            {/* Nav */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-indigo-600 p-1.5 rounded-lg">
                            <School className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-gray-900">SchoolSys</span>
                    </div>
                    <nav className="flex items-center gap-3">
                        <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                            Sign in
                        </Link>
                        <Link href="/register" className="text-sm font-semibold bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                            Start Free Trial
                        </Link>
                    </nav>
                </div>
            </header>

            <main className="flex-grow">
                {/* Hero */}
                <section className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white py-24 px-6">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
                            <CheckCircle2 size={14} />
                            Multi-tenant · Role-based · Fully featured
                        </div>
                        <h1 className="text-5xl sm:text-6xl font-extrabold leading-tight mb-6">
                            School Management,<br />
                            <span className="text-yellow-300">Done Right.</span>
                        </h1>
                        <p className="text-xl text-white/80 max-w-2xl mx-auto mb-10">
                            One platform to manage students, fees, attendance, timetables, staff, and reports.
                            Designed for Pakistani schools, built to scale.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                href="/register"
                                className="flex items-center gap-2 bg-white text-indigo-700 font-bold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl hover:bg-indigo-50 transition-all text-lg"
                            >
                                Start Free Trial <ArrowRight size={20} />
                            </Link>
                            <Link
                                href="/login"
                                className="flex items-center gap-2 bg-white/10 border border-white/30 text-white font-semibold px-8 py-4 rounded-xl hover:bg-white/20 transition-all text-lg"
                            >
                                Sign In
                            </Link>
                        </div>
                        <p className="text-white/50 text-sm mt-5">No credit card required · Set up in 60 seconds</p>
                    </div>
                </section>

                {/* Features grid */}
                <section className="py-24 px-6 bg-gray-50">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl font-bold text-gray-900">Everything your school needs</h2>
                            <p className="text-lg text-gray-500 mt-4 max-w-2xl mx-auto">
                                From fee challans to exam results, SchoolSys covers every workflow your admin, teachers, and parents rely on daily.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {features.map(({ icon: Icon, title, desc }) => (
                                <div key={title} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mb-4">
                                        <Icon className="h-5 w-5 text-indigo-600" />
                                    </div>
                                    <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                                    <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA banner */}
                <section className="py-20 px-6 bg-indigo-600">
                    <div className="max-w-3xl mx-auto text-center">
                        <h2 className="text-4xl font-bold text-white mb-4">Ready to get started?</h2>
                        <p className="text-indigo-200 text-lg mb-8">
                            Register your school in under a minute. No IT setup, no installation.
                        </p>
                        <Link
                            href="/register"
                            className="inline-flex items-center gap-2 bg-white text-indigo-700 font-bold px-8 py-4 rounded-xl shadow-lg hover:bg-indigo-50 transition-all text-lg"
                        >
                            Create Your School <ArrowRight size={20} />
                        </Link>
                    </div>
                </section>
            </main>

            <footer className="bg-gray-900 text-gray-400 py-10 px-6">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className="bg-indigo-600 p-1.5 rounded-lg">
                            <School className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-white font-bold">SchoolSys</span>
                    </div>
                    <p className="text-sm">&copy; {new Date().getFullYear()} SchoolSys. All rights reserved.</p>
                    <nav className="flex gap-4 text-sm">
                        <Link href="/login" className="hover:text-white transition-colors">Sign In</Link>
                        <Link href="/register" className="hover:text-white transition-colors">Register</Link>
                    </nav>
                </div>
            </footer>
        </div>
    );
}
