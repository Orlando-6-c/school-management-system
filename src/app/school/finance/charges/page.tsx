import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getAdditionalCharges } from '@/actions/finance';
import AdditionalChargesTable from '@/components/finance/AdditionalChargesTable';

export const dynamic = 'force-dynamic';

export default async function AdditionalChargesPage() {
    const session = await getSession();
    if (!session?.schoolId || !(session.role === 'SchoolAdmin' || session.role === 'Finance' || session.isSuperAdmin)) {
        redirect('/login');
    }

    const additionalCharges = await getAdditionalCharges();

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Additional Charges</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">{additionalCharges.length} charge{additionalCharges.length !== 1 ? 's' : ''} defined</p>
                </div>
                <Link href="/school/finance/charges/new">
                    <Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Add Charge</Button>
                </Link>
            </div>
            <AdditionalChargesTable additionalCharges={additionalCharges} />
        </div>
    );
}
