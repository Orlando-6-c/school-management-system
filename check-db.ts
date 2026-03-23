import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("SuperAdmins:");
    const superAdmins = await prisma.superAdmin.findMany();
    console.dir(superAdmins, { depth: null });

    console.log("\nUsers:");
    const users = await prisma.user.findMany();
    console.dir(users.map(u => ({ username: u.username, role: u.role, schoolId: u.schoolId })), { depth: null });
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
