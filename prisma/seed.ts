import { PrismaClient } from '@prisma/client';
import 'dotenv/config'; // Load env vars
import { hash } from 'bcryptjs';
import { ROLE_TEMPLATES } from '../src/lib/role-templates';

const prisma = new PrismaClient();

async function seedRoles(schoolId: string) {
    let ownerRole: any = null;
    let accountantRole: any = null;
    for (const t of ROLE_TEMPLATES) {
        const role = await prisma.role.upsert({
            where: { schoolId_name: { schoolId, name: t.name } },
            update: {},
            create: {
                schoolId,
                name: t.name,
                description: t.description,
                isSystem: true,
                isOwner: !!t.isOwner,
                permissions: t.permissions,
            },
        });
        if (t.isOwner) ownerRole = role;
        if (t.name === 'Accountant') accountantRole = role;
    }
    return { ownerRole, accountantRole };
}

async function main() {
    const rawPassword = process.env.SEED_ADMIN_PASSWORD || `seed-${Math.random().toString(36).slice(2, 10)}`;
    if (!process.env.SEED_ADMIN_PASSWORD) {
        console.warn(`SEED_ADMIN_PASSWORD not set — using generated password: ${rawPassword}`);
    }
    const password = await hash(rawPassword, 12);

    // 1. Create SuperAdmin if not exists
    const superAdmin = await prisma.superAdmin.upsert({
        where: { username: 'admin' },
        update: { password },
        create: {
            username: 'admin',
            password,
            email: 'admin@school.com',
        },
    });

    console.log('SuperAdmin ensured:', superAdmin.username);

    // 2. Create Route School Karyala
    const school = await prisma.school.upsert({
        where: { slug: 'route-school-karyala' },
        update: {},
        create: {
            name: 'Route School Karyala',
            slug: 'route-school-karyala',
            superAdminId: superAdmin.id,
        },
    });

    console.log('School ensured:', school.name);

    // 2b. Seed default role templates for this school.
    const { ownerRole, accountantRole } = await seedRoles(school.id);
    console.log('Roles seeded for school:', ROLE_TEMPLATES.map((t) => t.name).join(', '));

    // 3. Create School Admin User → Owner role
    const schoolAdmin = await prisma.user.upsert({
        where: {
            username_schoolId: {
                username: 'admin_route',
                schoolId: school.id
            }
        },
        update: { password, roleId: ownerRole?.id ?? null },
        create: {
            username: 'admin_route',
            password,
            role: 'SchoolAdmin',
            roleId: ownerRole?.id ?? null,
            schoolId: school.id,
            isActive: true,
        },
    });

    console.log('School Admin created:', schoolAdmin.username);

    // 4. Create Finance User (Clerk) → Accountant role
    const financeUser = await prisma.user.upsert({
        where: {
            username_schoolId: {
                username: 'clerk_route',
                schoolId: school.id
            }
        },
        update: { password, roleId: accountantRole?.id ?? null },
        create: {
            username: 'clerk_route',
            password,
            role: 'Finance',
            roleId: accountantRole?.id ?? null,
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
