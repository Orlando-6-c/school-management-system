import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function main() {
    const school = await db.school.findFirst({
        where: { name: { contains: 'Route School' } }
    });

    if (!school) {
        console.log('School not found. Querying all schools:');
        const all = await db.school.findMany();
        console.log(all.map(s => s.name));
        return;
    }

    console.log('Found school:', school.name, 'ID:', school.id);

    const classesToAdd = [
        { name: 'Prep', gradeLevel: 2 },
        { name: 'Grade 1', gradeLevel: 3 },
        { name: 'Grade 2', gradeLevel: 4 },
        { name: 'Grade 3', gradeLevel: 5 },
        { name: 'Grade 4', gradeLevel: 6 },
        { name: 'Grade 5', gradeLevel: 7 },
        { name: 'Grade 6', gradeLevel: 8 },
        { name: 'Grade 7', gradeLevel: 9 },
        { name: 'Grade 8', gradeLevel: 10 },
        { name: 'Grade 9', gradeLevel: 11 },
        { name: 'Grade 10', gradeLevel: 12 },
    ];

    for (const cls of classesToAdd) {
        try {
            const existing = await db.class.findFirst({
                where: { name: cls.name, schoolId: school.id }
            });

            if (existing) {
                await db.class.update({ where: { id: existing.id }, data: { isActive: true } });
                console.log(`Reactivated ${cls.name}`);
            } else {
                await db.class.create({
                    data: {
                        name: cls.name,
                        gradeLevel: cls.gradeLevel,
                        schoolId: school.id,
                        monthlyTuitionFee: 0,
                        hexCode: '#' + Math.floor(Math.random() * 16777215).toString(16),
                    }
                });
                console.log(`Created ${cls.name}`);
            }
        } catch (e: any) {
            console.error(`Failed to process ${cls.name}:`, e.message);
        }
    }
}

main().catch(console.error).finally(() => db.$disconnect());
