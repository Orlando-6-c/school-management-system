'use client';

import { useState, useTransition } from 'react';
import { createSchoolUser, setUserRole, setUserActive } from '@/actions/users';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, UserPlus } from 'lucide-react';

interface RoleOption {
    id: string;
    name: string;
    isOwner: boolean;
}

interface UserView {
    id: string;
    username: string;
    isActive: boolean;
    roleId: string | null;
    roleName: string;
    isOwner: boolean;
    isSelf: boolean;
    hasOverride: boolean;
}

interface Props {
    users: UserView[];
    roles: RoleOption[];
    canCreate: boolean;
    canEdit: boolean;
}

const selectClasses =
    'flex h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

export function UserManagementClient({ users, roles, canCreate, canEdit }: Props) {
    const [showForm, setShowForm] = useState(false);
    const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
    const [pending, startTransition] = useTransition();

    function notify(ok: boolean, text: string) {
        setMsg({ ok, text });
        setTimeout(() => setMsg(null), 4000);
    }

    function handleCreate(formData: FormData) {
        startTransition(async () => {
            const res = await createSchoolUser(formData);
            notify(res.success, res.message ?? '');
            if (res.success) setShowForm(false);
        });
    }

    function handleRoleChange(userId: string, roleId: string) {
        startTransition(async () => {
            const res = await setUserRole(userId, roleId);
            notify(res.success, res.message ?? '');
        });
    }

    function handleToggleActive(userId: string, next: boolean) {
        startTransition(async () => {
            const res = await setUserActive(userId, next);
            notify(res.success, res.message ?? '');
        });
    }

    return (
        <div className="space-y-6">
            {msg && (
                <div
                    className={`text-sm p-2 rounded ${msg.ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                >
                    {msg.text}
                </div>
            )}

            {canCreate && (
                <div className="border rounded-lg p-4 bg-card">
                    {!showForm ? (
                        <Button onClick={() => setShowForm(true)}>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Add User
                        </Button>
                    ) : (
                        <form action={handleCreate} className="grid gap-4 sm:grid-cols-3 items-end">
                            <div className="grid gap-1.5">
                                <Label htmlFor="username">Username</Label>
                                <Input id="username" name="username" required minLength={3} />
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="password">Temp Password</Label>
                                <Input id="password" name="password" type="text" required minLength={6} />
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="roleId">Role</Label>
                                <select id="roleId" name="roleId" required className={selectClasses}>
                                    <option value="">Select role…</option>
                                    {roles.map((r) => (
                                        <option key={r.id} value={r.id}>
                                            {r.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="sm:col-span-3 flex gap-2">
                                <Button type="submit" disabled={pending}>
                                    {pending ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Plus className="mr-2 h-4 w-4" />
                                    )}
                                    Create
                                </Button>
                                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            )}

            <div className="border rounded-lg overflow-hidden bg-card">
                <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-muted-foreground">
                        <tr>
                            <th className="text-left font-medium px-4 py-2">Username</th>
                            <th className="text-left font-medium px-4 py-2">Role</th>
                            <th className="text-left font-medium px-4 py-2">Status</th>
                            <th className="text-right font-medium px-4 py-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((u) => (
                            <tr key={u.id} className="border-t">
                                <td className="px-4 py-2 font-medium">
                                    {u.username}
                                    {u.isSelf && <span className="text-xs text-muted-foreground"> (you)</span>}
                                    {u.hasOverride && (
                                        <span className="ml-2 text-xs rounded bg-amber-100 text-amber-700 px-1.5 py-0.5">
                                            override
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-2">
                                    {canEdit && !u.isOwner ? (
                                        <select
                                            className={selectClasses}
                                            defaultValue={u.roleId ?? ''}
                                            disabled={pending}
                                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                        >
                                            {roles.map((r) => (
                                                <option key={r.id} value={r.id}>
                                                    {r.name}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <span>{u.roleName}</span>
                                    )}
                                </td>
                                <td className="px-4 py-2">
                                    <span
                                        className={`text-xs rounded px-2 py-0.5 ${u.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-muted text-muted-foreground'}`}
                                    >
                                        {u.isActive ? 'Active' : 'Disabled'}
                                    </span>
                                </td>
                                <td className="px-4 py-2 text-right">
                                    {canEdit && !u.isSelf && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            disabled={pending}
                                            onClick={() => handleToggleActive(u.id, !u.isActive)}
                                        >
                                            {u.isActive ? 'Disable' : 'Enable'}
                                        </Button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {users.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                                    No users yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
