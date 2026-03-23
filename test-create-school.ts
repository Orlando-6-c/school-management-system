import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    try {
        const superAdmin = await prisma.superAdmin.findFirst();
        if (!superAdmin) {
            console.error("No SuperAdmin found to link school to.");
            return;
        }

        const hashedPassword = await hash('password123', 12);

        await prisma.$transaction(async (tx) => {
            const school = await tx.school.create({
                data: {
                    name: 'Test School Bug',
                    slug: 'test-school-bug',
                    superAdminId: superAdmin.id,
                },
            });

            await tx.user.create({
                data: {
                    username: 'testadmin123',
                    password: hashedPassword,
                    role: 'SchoolAdmin',
                    schoolId: school.id,
                },
            });

            await tx.user.create({
                data: {
                    username: 'testadmin123_finance',
                    password: hashedPassword,
                    role: 'Finance',
                    schoolId: school.id,
                },
            });
            console.log("Successfully created school in transaction.");
        });
    } catch (error) {
        console.error("TRANSACTION ERROR:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
