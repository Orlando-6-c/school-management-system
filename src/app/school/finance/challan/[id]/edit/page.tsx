import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { getSession } from '@/lib/session';
import { getChallanForEdit } from '@/actions/finance';
import ChallanEditClient from '@/components/finance/ChallanEditClient';

export const dynamic = 'force-dynamic';

export default async function ChallanEditPage({ params }: { params: { id: string } }) {
    const session = await getSession();
    if (!session?.schoolId || !(session.role === 'SchoolAdmin' || session.role === 'Finance' || session.isSuperAdmin)) {
        redirect('/login');
    }

    const challan = await getChallanForEdit(params.id);
    if (!challan) notFound();

    return (
        <div className="space-y-6">
            <div>
                <Link href="/school/finance/challan" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3">
                    <ChevronLeft className="h-3.5 w-3.5" />Back to Challans
                </Link>
                <h1 className="text-2xl font-semibold text-foreground">Edit Challan</h1>
                <p className="text-sm text-muted-foreground mt-0.5">{challan.challanNumber} — {challan.month} {challan.year}</p>
            </div>
            <ChallanEditClient challan={challan} />
        </div>
    );
}
