import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUserWithPermissions, userCan } from '@/lib/authz';
import { listSchoolRoles } from '@/actions/users';
import { moduleEntries } from '@/lib/modules';
import { normalizePermissionMap } from '@/lib/permissions';
import { RoleManagementClient } from '@/components/school/RoleManagementClient';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export const runtime = 'nodejs';

export default async function RolesPage() {
    const actor = await getCurrentUserWithPermissions();
    if (!actor) redirect('/login');
    if (!actor.schoolId) redirect('/admin');
    if (!userCan(actor, 'users', 'view')) {
        return (
            <div className="max-w-3xl">
                <h1 className="text-2xl font-bold mb-2">Roles</h1>
                <p className="text-muted-foreground">You do not have access to this section.</p>
            </div>
        );
    }

    const roles = await listSchoolRoles();
    const rolesView = roles.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        isOwner: r.isOwner,
        isSystem: r.isSystem,
        userCount: r._count.users,
        permissions: normalizePermissionMap(r.permissions) as Record<string, string[]>,
    }));

    return (
        <div className="max-w-5xl">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Roles & Permissions</h1>
                    <p className="text-muted-foreground text-sm">
                        Define what each role can see and do, per module.
                    </p>
                </div>
                <Link href="/school/users">
                    <Button variant="outline">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Users
                    </Button>
                </Link>
            </div>

            <RoleManagementClient
                roles={rolesView}
                modules={moduleEntries().map((m) => ({ key: m.key, label: m.label, actions: [...m.actions] }))}
                canCreate={userCan(actor, 'users', 'create')}
                canEdit={userCan(actor, 'users', 'edit')}
                canDelete={userCan(actor, 'users', 'delete')}
            />
        </div>
    );
}
