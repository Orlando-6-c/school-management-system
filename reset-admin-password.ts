import { PrismaClient } from '@prisma/client';
import { hashPassword } from './src/lib/auth';

const prisma = new PrismaClient();

async function main() {
    const password = await hashPassword('password123');

    const admin = await prisma.superAdmin.update({
        where: { username: 'admin' },
        data: { password }
    });

    console.log("Password reset for admin:", admin.username);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
