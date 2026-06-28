import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { hasPermission } from '@/lib/authz';
import { TeacherImportClient } from './import-client';

export const runtime = 'nodejs';

export default async function ImportTeachersPage() {
    const session = await getSession();
    if (!session.schoolId) redirect('/login');
    if (!(await hasPermission('teachers', 'create'))) redirect('/school/teachers');

    return <TeacherImportClient />;
}
