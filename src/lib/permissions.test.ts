import { describe, it, expect } from 'vitest';
import {
    resolvePermissions,
    normalizePermissionMap,
    allPermissions,
    can,
} from './permissions';

describe('normalizePermissionMap', () => {
    it('keeps only valid module/action pairs', () => {
        const out = normalizePermissionMap({
            fees: ['view', 'create', 'bogus'],
            nonexistent: ['view'],
            settings: ['delete'], // settings has no delete action
        });
        expect(out).toEqual({ fees: ['view', 'create'] });
    });

    it('dedupes actions', () => {
        expect(normalizePermissionMap({ students: ['view', 'view', 'edit'] })).toEqual({
            students: ['view', 'edit'],
        });
    });

    it('returns empty for junk input', () => {
        expect(normalizePermissionMap(null)).toEqual({});
        expect(normalizePermissionMap('nope')).toEqual({});
        expect(normalizePermissionMap({ fees: 'view' })).toEqual({});
    });
});

describe('resolvePermissions', () => {
    it('SuperAdmin gets all permissions regardless of role', () => {
        const resolved = resolvePermissions(null, null, true);
        expect(resolved).toEqual(allPermissions());
        expect(can(resolved, 'users', 'delete')).toBe(true);
    });

    it('Owner role gets all permissions', () => {
        const resolved = resolvePermissions({ isOwner: true, permissions: {} });
        expect(resolved).toEqual(allPermissions());
    });

    it('returns the role base map, padded with empty modules', () => {
        const resolved = resolvePermissions({
            permissions: { fees: ['view', 'create'], payments: ['view'] },
        });
        expect(resolved.fees).toEqual(['view', 'create']);
        expect(resolved.payments).toEqual(['view']);
        expect(resolved.students).toEqual([]); // not granted
    });

    it('grant override adds actions on top of the role', () => {
        const resolved = resolvePermissions(
            { permissions: { fees: ['view'] } },
            { grant: { fees: ['create'], students: ['view'] } }
        );
        expect(resolved.fees.sort()).toEqual(['create', 'view']);
        expect(resolved.students).toEqual(['view']);
    });

    it('revoke override removes actions', () => {
        const resolved = resolvePermissions(
            { permissions: { fees: ['view', 'create', 'edit'] } },
            { revoke: { fees: ['edit'] } }
        );
        expect(resolved.fees.sort()).toEqual(['create', 'view']);
    });

    it('revoking every action clears the module', () => {
        const resolved = resolvePermissions(
            { permissions: { reports: ['view'] } },
            { revoke: { reports: ['view'] } }
        );
        expect(resolved.reports).toEqual([]);
        expect(can(resolved, 'reports', 'view')).toBe(false);
    });

    it('grants then revokes are both applied (revoke wins on conflict)', () => {
        const resolved = resolvePermissions(
            { permissions: { fees: ['view'] } },
            { grant: { fees: ['edit'] }, revoke: { fees: ['edit'] } }
        );
        expect(resolved.fees).toEqual(['view']);
    });

    it('ignores invalid override entries', () => {
        const resolved = resolvePermissions(
            { permissions: { fees: ['view'] } },
            { grant: { fees: ['nuke'], fake: ['view'] } as never }
        );
        expect(resolved.fees).toEqual(['view']);
    });

    it('null role yields no permissions', () => {
        const resolved = resolvePermissions(null);
        expect(can(resolved, 'students', 'view')).toBe(false);
    });
});
