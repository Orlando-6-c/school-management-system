import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { hasPermission } from '@/lib/authz';
import { FeeCollectionReport } from '@/components/school/reports/FeeCollectionReport';

export const runtime = 'nodejs';

export default async function FeeCollectionPage() {
    const session = await getSession();
    if (!session.schoolId) redirect('/login');
    if (!(await hasPermission('reports', 'view'))) redirect('/school/reports');

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Fee Collection</h1>
                <p className="text-muted-foreground mt-1">Monthly challan status and collection summary.</p>
            </div>
            <FeeCollectionReport />
        </div>
    );
}
