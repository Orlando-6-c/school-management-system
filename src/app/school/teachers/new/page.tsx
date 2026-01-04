import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import TeacherForm from '@/components/school/TeacherForm';

export default async function AddTeacherPage() {
    const session = await getSession();
    if (!session.schoolId) redirect('/login');

    return (
        <div className="container mx-auto py-10 max-w-4xl">
            <h1 className="text-3xl font-bold mb-6 text-foreground">Add New Teacher</h1>
            <TeacherForm />
        </div>
    );
}
