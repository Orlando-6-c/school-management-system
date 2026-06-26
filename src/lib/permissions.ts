/**
 * Permission resolution logic — pure functions, no I/O, fully unit-tested.
 *
 * A user's effective permissions are derived from their role's permission map,
 * then adjusted by optional per-user overrides (grants add, revokes remove).
 * SuperAdmins and the locked Owner role bypass all checks.
 */
import {
    type Action,
    type ModuleKey,
    type PermissionMap,
    MODULE_KEYS,
    MODULES,
    isValidPermission,
} from './modules';

/**
 * Per-user override shape, stored as JSON on User.permissionOverride.
 * `grant` adds actions on top of the role; `revoke` removes them.
 */
export interface PermissionOverride {
    grant?: PermissionMap;
    revoke?: PermissionMap;
}

export interface ResolvableRole {
    isOwner?: boolean;
    permissions?: unknown; // JSON from DB; validated/normalised here
}

/** Full all-access map (every action of every module). */
export function allPermissions(): Record<ModuleKey, Action[]> {
    const out = {} as Record<ModuleKey, Action[]>;
    for (const key of MODULE_KEYS) {
        out[key] = [...MODULES[key].actions];
    }
    return out;
}

/** Coerce arbitrary JSON into a clean PermissionMap, dropping anything invalid. */
export function normalizePermissionMap(input: unknown): PermissionMap {
    const out: PermissionMap = {};
    if (!input || typeof input !== 'object') return out;
    for (const [mod, actions] of Object.entries(input as Record<string, unknown>)) {
        if (!Array.isArray(actions)) continue;
        const valid = actions.filter(
            (a): a is Action => typeof a === 'string' && isValidPermission(mod, a)
        );
        if (valid.length > 0) {
            out[mod as ModuleKey] = Array.from(new Set(valid));
        }
    }
    return out;
}

/**
 * Resolve the effective permission map for a user.
 *
 * @param role   The user's role (may be null → no base permissions).
 * @param override Optional per-user grants/revokes.
 * @param isSuperAdmin If true, returns full all-access regardless of role.
 */
export function resolvePermissions(
    role: ResolvableRole | null | undefined,
    override?: PermissionOverride | null,
    isSuperAdmin = false
): Record<ModuleKey, Action[]> {
    if (isSuperAdmin || role?.isOwner) {
        return allPermissions();
    }

    // Start from the role's base map.
    const base = normalizePermissionMap(role?.permissions);
    const result: PermissionMap = {};
    for (const [mod, actions] of Object.entries(base)) {
        result[mod as ModuleKey] = [...(actions as Action[])];
    }

    // Apply grants.
    if (override?.grant) {
        const grants = normalizePermissionMap(override.grant);
        for (const [mod, actions] of Object.entries(grants)) {
            const key = mod as ModuleKey;
            const set = new Set(result[key] ?? []);
            for (const a of actions as Action[]) set.add(a);
            result[key] = Array.from(set);
        }
    }

    // Apply revokes.
    if (override?.revoke) {
        const revokes = normalizePermissionMap(override.revoke);
        for (const [mod, actions] of Object.entries(revokes)) {
            const key = mod as ModuleKey;
            if (!result[key]) continue;
            const remove = new Set(actions as Action[]);
            const kept = result[key]!.filter((a) => !remove.has(a));
            if (kept.length > 0) result[key] = kept;
            else delete result[key];
        }
    }

    // Fill missing modules with empty arrays for a stable shape.
    const full = {} as Record<ModuleKey, Action[]>;
    for (const key of MODULE_KEYS) {
        full[key] = result[key] ?? [];
    }
    return full;
}

/** Convenience: does this resolved map permit `action` on `module`? */
export function can(
    resolved: Record<ModuleKey, Action[]>,
    module: ModuleKey,
    action: Action
): boolean {
    return resolved[module]?.includes(action) ?? false;
}
