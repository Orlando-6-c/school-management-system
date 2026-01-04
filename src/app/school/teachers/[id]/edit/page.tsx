import { notFound, redirect } from 'next/navigation';
import db from '@/lib/db';
import { getSession } from '@/lib/session';
import TeacherForm from '@/components/school/TeacherForm';

export default async function EditTeacherPage({ params }: { params: { id: string } }) {
    const session = await getSession();
    if (!session.schoolId) redirect('/login');

    const { id } = params;

    const teacher = await db.teacher.findUnique({
        where: { id, schoolId: session.schoolId }
    });

    if (!teacher) notFound();

    return (
        <div className="container mx-auto py-10 max-w-4xl">
            <h1 className="text-3xl font-bold mb-6 text-foreground">Edit Teacher</h1>
            <TeacherForm initialData={teacher} />
        </div>
    );
}
