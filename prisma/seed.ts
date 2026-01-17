import { PrismaClient } from '@prisma/client';
import 'dotenv/config'; // Load env vars
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const password = await hash('password123', 12);

    // 1. Create SuperAdmin if not exists
    const superAdmin = await prisma.superAdmin.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            username: 'admin',
            password,
            email: 'admin@school.com',
        },
    });

    console.log('SuperAdmin ensured:', superAdmin.username);

    // 2. Create Demo School
    const school = await prisma.school.upsert({
        where: { slug: 'demo-school-a' },
        update: {},
        create: {
            name: 'Demo School A',
            slug: 'demo-school-a',
            superAdminId: superAdmin.id,
        },
    });

    console.log('School ensured:', school.name);

    // 3. Create School Admin User
    const schoolAdmin = await prisma.user.upsert({
        where: {
            username_schoolId: {
                username: 'admin_demo',
                schoolId: school.id
            }
        },
        update: {},
        create: {
            username: 'admin_demo',
            password,
            role: 'SchoolAdmin',
            schoolId: school.id,
            isActive: true,
        },
    });

    console.log('School Admin created:', schoolAdmin.username);

    // 4. Create Finance User (Clerk)
    const financeUser = await prisma.user.upsert({
        where: {
            username_schoolId: {
                username: 'clerk_demo',
                schoolId: school.id
            }
        },
        update: {},
        create: {
            username: 'clerk_demo',
            password,
            role: 'Finance',
            schoolId: school.id,
            isActive: true,
        },
    });

    console.log('Finance Clerk created:', financeUser.username);
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
