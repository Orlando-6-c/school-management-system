import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChangePasswordForm } from '@/components/school/ChangePasswordForm';

export const runtime = 'nodejs';

export default async function AccountSettingsPage() {
    const session = await getSession();
    if (!session.userId || !session.schoolId) redirect('/login');

    return (
        <div className="max-w-lg space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Account</h1>
                <p className="text-muted-foreground mt-1">Manage your login credentials.</p>
            </div>

            <Card className="border-border shadow-sm">
                <CardHeader>
                    <CardTitle>Change Password</CardTitle>
                    <CardDescription>
                        Enter your current password and choose a new one (minimum 8 characters).
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ChangePasswordForm />
                </CardContent>
            </Card>
        </div>
    );
}
