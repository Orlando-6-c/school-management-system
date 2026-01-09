import { getSession } from '@/lib/session';
import { getClasses } from '@/actions/academics';
import { getStudents } from '@/actions/student';
import { ChallanGenerationClient } from '@/components/school/ChallanGenerationClient';
import { redirect } from 'next/navigation';
import db from '@/lib/db'; // Import the db client

export const runtime = 'nodejs';

export default async function ChallanPage() {
    const session = await getSession();

    if (!session?.schoolId) {
        // Or handle this case more gracefully
        redirect('/login');
    }

    // 1. Fetch School Name
    const school = await db.school.findUnique({
        where: { id: session.schoolId },
        select: { name: true }
    });

    if (!school) {
        redirect('/error?message=School not found'); // Handle missing school
    }
    const initialSchoolName = school.name;

    // 2. Fetch Data on the Server
    const klassesData = await getClasses(session.schoolId);
    const studentsData = await getStudents(session.schoolId);

    // Ensure data is in a serializable format for the client component
    const initialKlasses = klassesData.map(k => ({
        id: k.id,
        name: k.name,
        section: k.section,
    }));

    const initialStudents = studentsData.map(s => ({
        id: s.id,
        name: s.name,
        rollNumber: s.rollNumber,
        class: s.class ? { id: s.class.id, name: s.class.name, section: s.class.section } : null,
        guardian: s.guardian ? { name: s.guardian.name } : null, // Pass only needed fields
    }));

    return (
        <ChallanGenerationClient 
            initialKlasses={initialKlasses}
            initialStudents={initialStudents}
            initialSchoolName={initialSchoolName} // Pass the school name
        />
    );
}
