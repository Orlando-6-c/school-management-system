import 'server-only';
import { ROLE_TEMPLATES } from './role-templates';

/**
 * Prisma-client-ish surface we need — works with both the extended client and a
 * transaction client (`tx`). Kept loose to avoid coupling to generated types.
 */
type RoleDelegate = {
    role: {
        findFirst: (args: any) => Promise<any>;
        create: (args: any) => Promise<any>;
        upsert: (args: any) => Promise<any>;
    };
};

/**
 * Ensure every default role template exists for a school. Idempotent — safe to
 * run on school creation and as a backfill for existing schools. Returns the
 * Owner role (useful for assigning the school admin).
 */
export async function seedRolesForSchool(client: RoleDelegate, schoolId: string) {
    let ownerRole: any = null;

    for (const template of ROLE_TEMPLATES) {
        const role = await client.role.upsert({
            where: { schoolId_name: { schoolId, name: template.name } },
            update: {}, // Don't clobber a school's customisations on re-run.
            create: {
                schoolId,
                name: template.name,
                description: template.description,
                isSystem: true,
                isOwner: !!template.isOwner,
                permissions: template.permissions,
            },
        });
        if (template.isOwner) ownerRole = role;
    }

    return ownerRole;
}
