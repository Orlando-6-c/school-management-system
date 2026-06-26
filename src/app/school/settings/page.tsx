import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { getSchoolSettings } from '@/actions/settings';
import SettingsForm from '@/components/school/SettingsForm';
import BankAccountsManager from '@/components/school/BankAccountsManager';
import FeePaymentPolicyEditor from '@/components/school/FeePaymentPolicyEditor';

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

            <SettingsForm initialSettings={settings} />
            <BankAccountsManager bankAccounts={settings.bankAccounts} />
            <FeePaymentPolicyEditor initialPolicy={settings.feePaymentPolicy} />
        </div>
    );
}
