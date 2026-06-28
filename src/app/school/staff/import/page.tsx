import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { hasPermission } from '@/lib/authz';
import { StaffImportClient } from './import-client';

export const runtime = 'nodejs';

export default async function ImportStaffPage() {
    const session = await getSession();
    if (!session.schoolId) redirect('/login');
    if (!(await hasPermission('staff', 'create'))) redirect('/school/staff');

    return <StaffImportClient />;
}
