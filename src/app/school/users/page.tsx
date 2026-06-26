import { redirect } from 'next/navigation';
import Link from 'next/link';
import db from '@/lib/db';
import { getCurrentUserWithPermissions, userCan } from '@/lib/authz';
import { UserManagementClient } from '@/components/school/UserManagementClient';
import { Button } from '@/components/ui/button';
import { ShieldCheck } from 'lucide-react';

export const runtime = 'nodejs';

export default async function UsersPage() {
    const actor = await getCurrentUserWithPermissions();
    if (!actor) redirect('/login');
    if (!actor.schoolId) redirect('/admin');
    if (!userCan(actor, 'users', 'view')) {
        return (
            <div className="max-w-3xl">
                <h1 className="text-2xl font-bold mb-2">User Management</h1>
                <p className="text-muted-foreground">You do not have access to this section.</p>
            </div>
        );
    }

    const [users, roles] = await Promise.all([
        db.user.findMany({
            where: { schoolId: actor.schoolId },
            include: { role_: { select: { id: true, name: true, isOwner: true } } },
            orderBy: { createdAt: 'asc' },
        }),
        db.role.findMany({
            where: { schoolId: actor.schoolId },
            orderBy: [{ isOwner: 'desc' }, { name: 'asc' }],
            select: { id: true, name: true, isOwner: true },
        }),
    ]);

    const canCreate = userCan(actor, 'users', 'create');
    const canEdit = userCan(actor, 'users', 'edit');

    const usersView = users.map((u) => ({
        id: u.id,
        username: u.username,
        isActive: u.isActive,
        roleId: u.role_?.id ?? null,
        roleName: u.role_?.name ?? '—',
        isOwner: u.role_?.isOwner ?? false,
        isSelf: u.id === actor.userId,
        hasOverride: !!u.permissionOverride,
    }));

    return (
        <div className="max-w-5xl">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">User Management</h1>
                    <p className="text-muted-foreground text-sm">
                        Create staff accounts and assign each a role.
                    </p>
                </div>
                <Link href="/school/users/roles">
                    <Button variant="outline">
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        Manage Roles
                    </Button>
                </Link>
            </div>

            <UserManagementClient
                users={usersView}
                roles={roles}
                canCreate={canCreate}
                canEdit={canEdit}
            />
        </div>
    );
}
