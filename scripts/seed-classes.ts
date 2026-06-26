import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

const CLASS_NAMES = [
    { name: 'Playgroup', level: -2, hexCode: 'PG' },
    { name: 'Nursery', level: -1, hexCode: 'NU' },
    { name: 'Prep', level: 0, hexCode: 'PR' },
    { name: 'Grade 1', level: 1, hexCode: '01' },
    { name: 'Grade 2', level: 2, hexCode: '02' },
    { name: 'Grade 3', level: 3, hexCode: '03' },
    { name: 'Grade 4', level: 4, hexCode: '04' },
    { name: 'Grade 5', level: 5, hexCode: '05' },
    { name: 'Grade 6', level: 6, hexCode: '06' },
    { name: 'Grade 7', level: 7, hexCode: '07' },
    { name: 'Grade 8', level: 8, hexCode: '08' },
    { name: 'Grade 9', level: 9, hexCode: '09' },
    { name: 'Grade 10', level: 10, hexCode: '10' }
];

async function main() {
    const school = await db.school.findFirst({
        where: { name: { contains: 'Route School' } }
    });

    if (!school) {
        throw new Error('School not found. Please ensure database is seeded.');
    }

    const teachers = await db.teacher.findMany({
        where: { schoolId: school.id }
    });

    if (teachers.length < CLASS_NAMES.length) {
        console.warn(`Warning: Only ${teachers.length} teachers available for ${CLASS_NAMES.length} classes. Some may be left unassigned.`);
    }

    console.log(`Mapping ${CLASS_NAMES.length} classes to Route School Karyala...`);

    // First delete any previous artifacts to keep cleanly isolated
    await db.class.deleteMany({
        where: { schoolId: school.id }
    });

    for (let i = 0; i < CLASS_NAMES.length; i++) {
        const clsParams = CLASS_NAMES[i];

        try {
            const newClass = await db.class.create({
                data: {
                    name: clsParams.name,
                    gradeLevel: clsParams.level,
                    hexCode: clsParams.hexCode,
                    section: 'A',
                    monthlyTuitionFee: 3000,
                    schoolId: school.id
                }
            });

            if (i < teachers.length) {
                await db.teacherClassAssignment.create({
                    data: {
                        teacherId: teachers[i].id,
                        classId: newClass.id,
                        subject: 'Class Teacher',
                        isClassTeacher: true,
                    }
                });
                console.log(`Created ${clsParams.name} (Section A) | Fee: 3000 | Assigned: ${teachers[i].firstName} ${teachers[i].lastName}`);
            } else {
                console.log(`Created ${clsParams.name} (Section A) | Fee: 3000 | Unassigned (Ran out of mock teachers)`);
            }
        } catch (e: any) {
            console.log(`Failed to inject ${clsParams.name}:`, e.message);
        }
    }
}

main().catch(console.error).finally(() => db.$disconnect());
