// src/app/school/finance/charges/page.tsx
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAdditionalCharges } from '@/actions/finance';
import AdditionalChargesTable from '@/components/finance/AdditionalChargesTable'; // To be created

export const runtime = 'nodejs';

export default async function AdditionalChargesPage() {
    const session = await getSession();

    if (!session?.schoolId || !(session.role === 'SchoolAdmin' || session.role === 'Finance')) {
        redirect('/login'); // Redirect unauthorized users
    }

    const additionalCharges = await getAdditionalCharges();

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Additional Charges Management</h1>
                <Link href="/school/finance/charges/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add New Charge
                    </Button>
                </Link>
            </div>

            <Card className="bg-white border-gray-200 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-gray-900">All Additional Charges</CardTitle>
                    <CardDescription>
                        Total Additional Charges: {additionalCharges.length}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <AdditionalChargesTable additionalCharges={additionalCharges} />
                </CardContent>
            </Card>
        </div>
    );
}
