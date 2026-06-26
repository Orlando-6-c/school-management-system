import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { getClasses } from '@/actions/academics';
import ChallanGenerateForm from '@/components/finance/ChallanGenerateForm';

export const dynamic = 'force-dynamic';

export default async function ChallanGeneratePage() {
    const session = await getSession();
    if (!session?.schoolId || !(session.role === 'SchoolAdmin' || session.role === 'Finance' || session.isSuperAdmin)) {
        redirect('/login');
    }

    const classes = await getClasses();
    const classesForForm = classes.map(c => ({ id: c.id, name: c.name, section: c.section ?? null }));

    return (
        <div className="space-y-6">
            <div>
                <Link href="/school/finance/challan" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3">
                    <ChevronLeft className="h-3.5 w-3.5" />Back to Challans
                </Link>
                <h1 className="text-2xl font-semibold text-foreground">Generate Fee Challans</h1>
                <p className="text-sm text-muted-foreground mt-0.5">Bulk-generate monthly fee challans for students.</p>
            </div>
            <ChallanGenerateForm classes={classesForForm} />
        </div>
    );
}
