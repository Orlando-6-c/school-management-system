import { describe, it, expect } from 'vitest';
import { generateRollNumber } from './roll-number';

describe('generateRollNumber', () => {
    it('builds YY + zero-padded sequence + uppercase grade', () => {
        const result = generateRollNumber('a', new Date('2026-09-01'), 0);
        expect(result).toBe('26001A');
    });

    it('increments the sequence from the current count', () => {
        const result = generateRollNumber('A', new Date('2026-01-10'), 41);
        expect(result).toBe('26042A');
    });

    it('uppercases the grade hex', () => {
        const result = generateRollNumber('ff', new Date('2025-06-25'), 9);
        expect(result).toBe('25010FF');
    });

    it('uses the last two digits of the admission year', () => {
        const result = generateRollNumber('B', new Date('2030-03-03'), 0);
        expect(result.startsWith('30')).toBe(true);
    });
});
