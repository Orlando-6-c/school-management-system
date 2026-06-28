import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { getSchoolSettings } from '@/actions/settings';
import SettingsForm from '@/components/school/SettingsForm';
import BankAccountsManager from '@/components/school/BankAccountsManager';
import FeePaymentPolicyEditor from '@/components/school/FeePaymentPolicyEditor';
import Link from 'next/link';
import { CreditCard, User, ScrollText } from 'lucide-react';

export const runtime = 'nodejs';

export default async function SettingsPage() {
    const session = await getSession();

    if (!session.schoolId || (session.role !== 'SchoolAdmin' && !session.isSuperAdmin)) {
        redirect('/school');
    }

    const settings = await getSchoolSettings();

    if (!settings) {
        return (
            <div className="space-y-6">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
                <div className="bg-red-50 text-red-700 p-4 rounded-lg">
                    Failed to load settings. Please try again.
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">School Settings</h1>
                <p className="text-muted-foreground mt-2">Manage your school configuration and preferences.</p>
            </div>

            {/* Quick links */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                    { href: '/school/settings/account', icon: User, label: 'Account & Password', desc: 'Change your login password' },
                    { href: '/school/settings/billing', icon: CreditCard, label: 'Billing & Plan', desc: 'View plan, usage, and limits' },
                    { href: '/school/settings/export', icon: ScrollText, label: 'Data Export', desc: 'Download school data as CSV' },
                    { href: '/school/settings/audit-log', icon: ScrollText, label: 'Audit Log', desc: 'Track all system activity' },
                ].map(({ href, icon: Icon, label, desc }) => (
                    <Link
                        key={href}
                        href={href}
                        className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl hover:border-primary/40 hover:shadow-sm transition-all group"
                    >
                        <div className="w-9 h-9 bg-muted rounded-lg flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                            <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-foreground">{label}</p>
                            <p className="text-xs text-muted-foreground">{desc}</p>
                        </div>
                    </Link>
                ))}
            </div>

            <SettingsForm initialSettings={settings} />
            <BankAccountsManager bankAccounts={settings.bankAccounts} />
            <FeePaymentPolicyEditor initialPolicy={settings.feePaymentPolicy} />
        </div>
    );
}
