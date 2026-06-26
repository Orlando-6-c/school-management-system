/**
 * Default role templates seeded for every new school. The Owner role is locked
 * (all access, cannot be edited/removed); the rest are starting points the
 * school admin can clone and customise. Permissions are action-level.
 */
import type { Action, ModuleKey } from './modules';

export interface RoleTemplate {
    name: string;
    description: string;
    isOwner?: boolean;
    permissions: Partial<Record<ModuleKey, Action[]>>;
}

export const ROLE_TEMPLATES: RoleTemplate[] = [
    {
        name: 'Owner',
        description: 'Full access to everything. This role is locked and cannot be edited or removed.',
        isOwner: true,
        permissions: {}, // Owner bypasses checks; permissions resolved as all-access.
    },
    {
        name: 'Accountant',
        description: 'Manages all finance: fees, payments, expenses, salaries, and reports.',
        permissions: {
            fees: ['view', 'create', 'edit', 'delete'],
            payments: ['view', 'create', 'edit'],
            expenses: ['view', 'create', 'edit', 'delete'],
            salaries: ['view', 'create', 'edit'],
            reports: ['view'],
        },
    },
    {
        name: 'Customer Representative',
        description: 'Front-desk: register students and view fees/payments.',
        permissions: {
            students: ['view', 'create'],
            fees: ['view'],
            payments: ['view'],
            parents: ['view', 'create'],
        },
    },
    {
        name: 'Teacher',
        description: 'View students and classes, manage attendance and academics, view reports.',
        permissions: {
            students: ['view'],
            classes: ['view'],
            attendance: ['view', 'create', 'edit'],
            academics: ['view', 'create', 'edit', 'delete'],
            reports: ['view'],
        },
    },
    {
        name: 'Read-only',
        description: 'View access across the main modules; cannot make changes.',
        permissions: {
            students: ['view'],
            classes: ['view'],
            teachers: ['view'],
            staff: ['view'],
            fees: ['view'],
            payments: ['view'],
            expenses: ['view'],
            salaries: ['view'],
            reports: ['view'],
        },
    },
];

export const OWNER_TEMPLATE = ROLE_TEMPLATES[0];
