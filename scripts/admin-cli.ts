/**
 * Admin maintenance CLI — replaces the ad-hoc debug scripts that used to live
 * in the repo root with a single, gated tool. No hardcoded passwords: every
 * mutating command requires explicit arguments, and passwords are read from a
 * prompt / argument rather than baked into source.
 *
 * Usage:
 *   npx tsx scripts/admin-cli.ts list-admins
 *   npx tsx scripts/admin-cli.ts list-users [--school <slug>]
 *   npx tsx scripts/admin-cli.ts reset-admin-password --username <name> --password <newPassword>
 *
 * This script is intended for local/operator use only. It refuses to run in
 * production unless ALLOW_ADMIN_CLI=true is explicitly set.
 */
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

if (process.env.NODE_ENV === 'production' && process.env.ALLOW_ADMIN_CLI !== 'true') {
    console.error('Refusing to run admin-cli in production. Set ALLOW_ADMIN_CLI=true to override.');
    process.exit(1);
}

const prisma = new PrismaClient();

function getFlag(name: string): string | undefined {
    const idx = process.argv.indexOf(`--${name}`);
    return idx !== -1 ? process.argv[idx + 1] : undefined;
}

async function listAdmins() {
    const admins = await prisma.superAdmin.findMany({
        select: { id: true, username: true, createdAt: true },
    });
    console.table(admins);
}

async function listUsers() {
    const slug = getFlag('school');
    const users = await prisma.user.findMany({
        where: slug ? { school: { slug } } : undefined,
        select: { username: true, role: true, isActive: true, schoolId: true },
    });
    console.table(users);
}

async function resetAdminPassword() {
    const username = getFlag('username');
    const password = getFlag('password');
    if (!username || !password) {
        throw new Error('reset-admin-password requires --username <name> --password <newPassword>');
    }
    if (password.length < 8) {
        throw new Error('Password must be at least 8 characters.');
    }
    const hashed = await hash(password, 12);
    const admin = await prisma.superAdmin.update({
        where: { username },
        data: { password: hashed },
    });
    console.log(`Password reset for SuperAdmin: ${admin.username}`);
}

async function main() {
    const command = process.argv[2];
    switch (command) {
        case 'list-admins':
            return listAdmins();
        case 'list-users':
            return listUsers();
        case 'reset-admin-password':
            return resetAdminPassword();
        default:
            console.log(
                'Commands:\n' +
                    '  list-admins\n' +
                    '  list-users [--school <slug>]\n' +
                    '  reset-admin-password --username <name> --password <newPassword>'
            );
            process.exit(command ? 1 : 0);
    }
}

main()
    .catch((e) => {
        console.error(e instanceof Error ? e.message : e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
