import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { getSchoolSubscription } from '@/actions/subscription';
import { PLANS, getTrialDaysLeft } from '@/lib/plans';
import { CheckCircle2, AlertTriangle, XCircle, Crown, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export const runtime = 'nodejs';

function UsageBar({ value, max, label }: { value: number; max: number | -1; label: string }) {
    const isUnlimited = max === -1;
    const pct = isUnlimited ? 0 : Math.min(100, Math.round((value / max) * 100));
    const color = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500';

    return (
        <div>
            <div className="flex justify-between text-sm mb-1.5">
                <span className="font-medium text-foreground">{label}</span>
                <span className="text-muted-foreground">
                    {value} / {isUnlimited ? '∞' : max}
                </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
                {!isUnlimited && <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />}
                {isUnlimited && <div className="h-full bg-emerald-500 rounded-full w-1/4 opacity-30" />}
            </div>
        </div>
    );
}

export default async function BillingPage() {
    const session = await getSession();
    if (!session.schoolId) redirect('/login');

    const info = await getSchoolSubscription();
    if (!info) {
        return (
            <div className="space-y-6 max-w-3xl">
                <h1 className="text-3xl font-bold text-foreground">Billing & Plan</h1>
                <p className="text-muted-foreground">No subscription found for this school. Please contact support.</p>
            </div>
        );
    }

    const plan = PLANS[info.plan];
    const daysLeft = info.status === 'Trial' ? getTrialDaysLeft(info.trialEndsAt!) : null;
    const isTrialExpired = info.status === 'Trial' && (daysLeft ?? 0) <= 0;
    const isActive = info.status === 'Active';
    const isCancelled = info.status === 'Cancelled' || info.status === 'Expired';

    const statusChip = isActive
        ? { label: 'Active', icon: CheckCircle2, cls: 'bg-emerald-100 text-emerald-700' }
        : isTrialExpired || isCancelled
            ? { label: isTrialExpired ? 'Trial Expired' : info.status, icon: XCircle, cls: 'bg-red-100 text-red-700' }
            : { label: `Trial — ${daysLeft} day${daysLeft === 1 ? '' : 's'} left`, icon: AlertTriangle, cls: 'bg-amber-100 text-amber-700' };

    return (
        <div className="space-y-8 max-w-3xl">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Billing & Plan</h1>
                <p className="text-muted-foreground mt-1">Your current plan and usage.</p>
            </div>

            {/* Current plan card */}
            <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                            <Crown className="h-5 w-5 text-violet-600" />
                        </div>
                        <div>
                            <p className="font-bold text-lg text-foreground">{plan.label}</p>
                            <p className="text-sm text-muted-foreground">
                                {plan.pricePerMonth === null
                                    ? 'Custom pricing'
                                    : plan.pricePerMonth === 0
                                        ? 'Free'
                                        : `Rs ${plan.pricePerMonth.toLocaleString()} / month`}
                            </p>
                        </div>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${statusChip.cls}`}>
                        <statusChip.icon className="h-3.5 w-3.5" />
                        {statusChip.label}
                    </span>
                </div>

                {info.status === 'Trial' && !isTrialExpired && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                        <strong>Trial period:</strong> Your free trial
                        {info.trialEndsAt ? ` ends on ${new Date(info.trialEndsAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' })}` : ''}.
                        All features are available during the trial.
                    </div>
                )}

                {isTrialExpired && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800">
                        <strong>Trial expired:</strong> Student enrolment and user creation are paused. Contact us to upgrade.
                    </div>
                )}

                {isActive && info.currentPeriodEnd && (
                    <p className="text-sm text-muted-foreground">
                        Next renewal: {new Date(info.currentPeriodEnd).toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                )}
            </div>

            {/* Usage */}
            <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-5">
                <h2 className="font-semibold text-foreground">Current Usage</h2>
                <UsageBar value={info.studentCount} max={info.maxStudents} label="Students" />
                <UsageBar value={info.userCount} max={info.maxUsers} label="User accounts" />
            </div>

            {/* Plan features */}
            <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
                <h2 className="font-semibold text-foreground mb-4">What&apos;s included</h2>
                <ul className="space-y-2">
                    {plan.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                            {f}
                        </li>
                    ))}
                </ul>
            </div>

            {/* Upgrade CTA */}
            {info.plan !== 'District' && (
                <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-2xl p-6 text-white">
                    <h2 className="font-bold text-lg mb-1">Ready to upgrade?</h2>
                    <p className="text-white/80 text-sm mb-4">
                        Contact us to upgrade your plan, increase limits, or get a custom quote for your school network.
                    </p>
                    <a
                        href="mailto:support@schoolsys.pk?subject=Plan Upgrade Request"
                        className="inline-flex items-center gap-2 bg-white text-violet-700 font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-violet-50 transition-colors"
                    >
                        Contact us to upgrade <ArrowRight className="h-4 w-4" />
                    </a>
                </div>
            )}

            <p className="text-xs text-muted-foreground">
                Need help?{' '}
                <a href="mailto:support@schoolsys.pk" className="underline hover:text-foreground">
                    Contact support
                </a>{' '}
                ·{' '}
                <Link href="/school/settings" className="underline hover:text-foreground">
                    Back to settings
                </Link>
            </p>
        </div>
    );
}
