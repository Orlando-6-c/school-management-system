/**
 * Module registry — the single source of truth for what feature areas exist
 * and which actions each supports. This lives in code (not the database) so the
 * set of modules/actions is versioned and type-safe. Schools customise *which*
 * actions a role gets, not the catalogue itself.
 */

export const ACTIONS = ['view', 'create', 'edit', 'delete'] as const;
export type Action = (typeof ACTIONS)[number];

export const MODULES = {
    students: { label: 'Students', actions: ['view', 'create', 'edit', 'delete'] },
    classes: { label: 'Classes', actions: ['view', 'create', 'edit', 'delete'] },
    teachers: { label: 'Teachers', actions: ['view', 'create', 'edit', 'delete'] },
    staff: { label: 'Staff', actions: ['view', 'create', 'edit', 'delete'] },
    parents: { label: 'Parents & Guardians', actions: ['view', 'create', 'edit', 'delete'] },
    fees: { label: 'Fees & Challans', actions: ['view', 'create', 'edit', 'delete'] },
    payments: { label: 'Payments & Income', actions: ['view', 'create', 'edit'] },
    expenses: { label: 'Expenses', actions: ['view', 'create', 'edit', 'delete'] },
    salaries: { label: 'Salaries', actions: ['view', 'create', 'edit'] },
    attendance: { label: 'Attendance', actions: ['view', 'create', 'edit'] },
    academics: { label: 'Academics', actions: ['view', 'create', 'edit', 'delete'] },
    reports: { label: 'Reports', actions: ['view'] },
    users: { label: 'User Management', actions: ['view', 'create', 'edit', 'delete'] },
    settings: { label: 'Settings', actions: ['view', 'edit'] },
} as const satisfies Record<string, { label: string; actions: readonly Action[] }>;

export type ModuleKey = keyof typeof MODULES;

export const MODULE_KEYS = Object.keys(MODULES) as ModuleKey[];

/** Permissions map: which actions are allowed per module. */
export type PermissionMap = Partial<Record<ModuleKey, Action[]>>;

/** A full module entry, e.g. for iterating in the UI. */
export function moduleEntries() {
    return MODULE_KEYS.map((key) => ({ key, ...MODULES[key] }));
}

/** Returns true if `module` exists and supports `action`. */
export function isValidPermission(module: string, action: string): boolean {
    const mod = (MODULES as Record<string, { actions: readonly string[] }>)[module];
    return !!mod && mod.actions.includes(action);
}
