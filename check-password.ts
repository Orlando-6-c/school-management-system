import { PrismaClient } from '@prisma/client';
import { verifyPassword } from './src/lib/auth';

const prisma = new PrismaClient();

async function main() {
    const admin = await prisma.superAdmin.findUnique({ where: { username: 'admin' } });
    if (admin) {
        console.log("Found admin:", admin.username);
        const matches = await verifyPassword('password123', admin.password);
        console.log("Password matches 'password123':", matches);
    } else {
        console.log("Admin not found");
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
