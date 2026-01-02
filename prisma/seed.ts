import { PrismaClient } from '../src/generated/prisma';
import 'dotenv/config'; // Load env vars
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const password = await hash('admin123', 12);

    const superAdmin = await prisma.superAdmin.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            username: 'admin',
            password,
            email: 'admin@school.com',
        },
    });

    console.log({ superAdmin });
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error('Seed Error:', e.message || e);
        await prisma.$disconnect();
        process.exit(1);
    });
