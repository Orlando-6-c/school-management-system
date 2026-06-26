'use client';

import { useState, useTransition } from 'react';
import {
    createRole,
    updateRolePermissions,
    deleteRole,
} from '@/actions/users';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Trash2, Lock, Save } from 'lucide-react';

interface ModuleDef {
    key: string;
    label: string;
    actions: string[];
}

interface RoleView {
    id: string;
    name: string;
    description: string | null;
    isOwner: boolean;
    isSystem: boolean;
    userCount: number;
    permissions: Record<string, string[]>;
}

interface Props {
    roles: RoleView[];
    modules: ModuleDef[];
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
}

export function RoleManagementClient({ roles, modules, canCreate, canEdit, canDelete }: Props) {
    const [selectedId, setSelectedId] = useState<string>(roles[0]?.id ?? '');
    const [showCreate, setShowCreate] = useState(false);
    const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
    const [pending, startTransition] = useTransition();

    const selected = roles.find((r) => r.id === selectedId) ?? roles[0];

    function notify(ok: boolean, text: string) {
        setMsg({ ok, text });
        setTimeout(() => setMsg(null), 4000);
    }

    function handleCreate(formData: FormData) {
        startTransition(async () => {
            const res = await createRole(formData);
            notify(res.success, res.message ?? '');
            if (res.success) setShowCreate(false);
        });
    }

    function handleDelete(roleId: string) {
        if (!confirm('Delete this role? This cannot be undone.')) return;
        startTransition(async () => {
            const res = await deleteRole(roleId);
            notify(res.success, res.message ?? '');
            if (res.success && selectedId === roleId) setSelectedId(roles[0]?.id ?? '');
        });
    }

    return (
        <div className="space-y-4">
            {msg && (
                <div className={`text-sm p-2 rounded ${msg.ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {msg.text}
                </div>
            )}

            <div className="grid md:grid-cols-[260px_1fr] gap-4">
                {/* Role list */}
                <div className="space-y-2">
                    {roles.map((r) => (
                        <button
                            key={r.id}
                            onClick={() => setSelectedId(r.id)}
                            className={`w-full text-left border rounded-lg px-3 py-2 transition-colors ${
                                selectedId === r.id ? 'border-primary bg-primary/5' : 'bg-card hover:bg-muted/50'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-medium flex items-center gap-1.5">
                                    {r.isOwner && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                                    {r.name}
                                </span>
                                <span className="text-xs text-muted-foreground">{r.userCount}</span>
                            </div>
                            {r.description && (
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{r.description}</p>
                            )}
                        </button>
                    ))}

                    {canCreate && (
                        <div className="border rounded-lg p-3 bg-card">
                            {!showCreate ? (
                                <Button size="sm" variant="outline" className="w-full" onClick={() => setShowCreate(true)}>
                                    <Plus className="mr-2 h-4 w-4" /> New Role
                                </Button>
                            ) : (
                                <form action={handleCreate} className="space-y-2">
                                    <div className="grid gap-1">
                                        <Label htmlFor="name" className="text-xs">Name</Label>
                                        <Input id="name" name="name" required minLength={2} />
                                    </div>
                                    <div className="grid gap-1">
                                        <Label htmlFor="description" className="text-xs">Description</Label>
                                        <Input id="description" name="description" />
                                    </div>
                                    <div className="grid gap-1">
                                        <Label htmlFor="cloneFromId" className="text-xs">Clone from (optional)</Label>
                                        <select
                                            id="cloneFromId"
                                            name="cloneFromId"
                                            className="flex h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-sm"
                                        >
                                            <option value="">Empty</option>
                                            {roles.filter((r) => !r.isOwner).map((r) => (
                                                <option key={r.id} value={r.id}>{r.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="sm" type="submit" disabled={pending}>
                                            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
                                        </Button>
                                        <Button size="sm" type="button" variant="outline" onClick={() => setShowCreate(false)}>
                                            Cancel
                                        </Button>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}
                </div>

                {/* Permission grid for the selected role */}
                {selected && (
                    <PermissionGrid
                        key={selected.id}
                        role={selected}
                        modules={modules}
                        canEdit={canEdit}
                        canDelete={canDelete}
                        pending={pending}
                        onSave={(perms) =>
                            startTransition(async () => {
                                const res = await updateRolePermissions(selected.id, perms);
                                notify(res.success, res.message ?? '');
                            })
                        }
                        onDelete={() => handleDelete(selected.id)}
                    />
                )}
            </div>
        </div>
    );
}

function PermissionGrid({
    role,
    modules,
    canEdit,
    canDelete,
    pending,
    onSave,
    onDelete,
}: {
    role: RoleView;
    modules: ModuleDef[];
    canEdit: boolean;
    canDelete: boolean;
    pending: boolean;
    onSave: (perms: Record<string, string[]>) => void;
    onDelete: () => void;
}) {
    const [perms, setPerms] = useState<Record<string, string[]>>(() => ({ ...role.permissions }));
    const locked = role.isOwner || !canEdit;

    function toggle(moduleKey: string, action: string) {
        if (locked) return;
        setPerms((prev) => {
            const current = new Set(prev[moduleKey] ?? []);
            if (current.has(action)) current.delete(action);
            else current.add(action);
            const next = { ...prev };
            if (current.size > 0) next[moduleKey] = Array.from(current);
            else delete next[moduleKey];
            return next;
        });
    }

    function toggleRow(mod: ModuleDef, on: boolean) {
        if (locked) return;
        setPerms((prev) => {
            const next = { ...prev };
            if (on) next[mod.key] = [...mod.actions];
            else delete next[mod.key];
            return next;
        });
    }

    return (
        <div className="border rounded-lg bg-card p-4">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h2 className="text-lg font-semibold flex items-center gap-1.5">
                        {role.isOwner && <Lock className="h-4 w-4 text-muted-foreground" />}
                        {role.name}
                    </h2>
                    {role.isOwner && (
                        <p className="text-xs text-muted-foreground">Locked — full access to everything.</p>
                    )}
                </div>
                {canDelete && !role.isOwner && (
                    <Button size="sm" variant="destructive" disabled={pending} onClick={onDelete}>
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </Button>
                )}
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="text-muted-foreground">
                        <tr>
                            <th className="text-left font-medium py-2 pr-4">Module</th>
                            {['view', 'create', 'edit', 'delete'].map((a) => (
                                <th key={a} className="font-medium py-2 px-3 capitalize text-center">{a}</th>
                            ))}
                            <th className="py-2 px-3 text-center font-medium">All</th>
                        </tr>
                    </thead>
                    <tbody>
                        {modules.map((mod) => {
                            const allOn = mod.actions.every((a) => perms[mod.key]?.includes(a));
                            return (
                                <tr key={mod.key} className="border-t">
                                    <td className="py-2 pr-4 font-medium">{mod.label}</td>
                                    {['view', 'create', 'edit', 'delete'].map((a) => {
                                        const supported = mod.actions.includes(a);
                                        const checked = perms[mod.key]?.includes(a) ?? false;
                                        return (
                                            <td key={a} className="py-2 px-3 text-center">
                                                {supported ? (
                                                    <input
                                                        type="checkbox"
                                                        className="h-4 w-4 accent-primary"
                                                        checked={role.isOwner ? true : checked}
                                                        disabled={locked}
                                                        onChange={() => toggle(mod.key, a)}
                                                    />
                                                ) : (
                                                    <span className="text-muted-foreground/40">—</span>
                                                )}
                                            </td>
                                        );
                                    })}
                                    <td className="py-2 px-3 text-center">
                                        <input
                                            type="checkbox"
                                            className="h-4 w-4 accent-primary"
                                            checked={role.isOwner ? true : allOn}
                                            disabled={locked}
                                            onChange={(e) => toggleRow(mod, e.target.checked)}
                                        />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {!locked && (
                <div className="mt-4 flex justify-end">
                    <Button disabled={pending} onClick={() => onSave(perms)}>
                        {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Changes
                    </Button>
                </div>
            )}
        </div>
    );
}
