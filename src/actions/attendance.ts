'use server';

import { getSession } from '@/lib/session';
import { hasPermission } from '@/lib/authz';
import db from '@/lib/db';

export async function getAttendanceReport(classId: string, date: string) {
    const session = await getSession();
    if (!session.schoolId || !(await hasPermission('attendance', 'view'))) {
        return { success: false as const, message: 'Access denied' };
    }

    const targetDate = new Date(date);
    // Normalise to start-of-day UTC to match DB storage
    targetDate.setUTCHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);

    const students = await db.student.findMany({
        where: { schoolId: session.schoolId, classId, isActive: true, deletedAt: null },
        orderBy: { name: 'asc' },
        select: { id: true, name: true, rollNumber: true },
    });

    const records = await db.attendance.findMany({
        where: {
            schoolId: session.schoolId,
            classId,
            date: { gte: targetDate, lt: nextDay },
        },
        select: { studentId: true, isPresent: true, remarks: true },
    });

    const recordMap = new Map(records.map((r) => [r.studentId, r]));

    const rows = students.map((s) => {
        const rec = recordMap.get(s.id);
        return {
            studentId: s.id,
            name: s.name,
            rollNumber: s.rollNumber,
            status: rec ? (rec.isPresent ? 'present' : 'absent') : 'not-marked',
            remarks: rec?.remarks ?? null,
        };
    });

    const present = rows.filter((r) => r.status === 'present').length;
    const absent = rows.filter((r) => r.status === 'absent').length;
    const notMarked = rows.filter((r) => r.status === 'not-marked').length;

    return { success: true as const, rows, stats: { present, absent, notMarked, total: rows.length } };
}

export async function getAttendanceSummary(classId: string, fromDate: string, toDate: string) {
    const session = await getSession();
    if (!session.schoolId || !(await hasPermission('attendance', 'view'))) {
        return { success: false as const, message: 'Access denied' };
    }

    const from = new Date(fromDate);
    from.setUTCHours(0, 0, 0, 0);
    const to = new Date(toDate);
    to.setUTCHours(23, 59, 59, 999);

    const students = await db.student.findMany({
        where: { schoolId: session.schoolId, classId, isActive: true, deletedAt: null },
        orderBy: { name: 'asc' },
        select: { id: true, name: true, rollNumber: true },
    });

    const records = await db.attendance.findMany({
        where: {
            schoolId: session.schoolId,
            classId,
            date: { gte: from, lte: to },
        },
        select: { studentId: true, isPresent: true },
    });

    const countMap = new Map<string, { present: number; total: number }>();
    for (const r of records) {
        const cur = countMap.get(r.studentId) ?? { present: 0, total: 0 };
        countMap.set(r.studentId, {
            present: cur.present + (r.isPresent ? 1 : 0),
            total: cur.total + 1,
        });
    }

    const rows = students.map((s) => {
        const counts = countMap.get(s.id) ?? { present: 0, total: 0 };
        return {
            studentId: s.id,
            name: s.name,
            rollNumber: s.rollNumber,
            present: counts.present,
            absent: counts.total - counts.present,
            total: counts.total,
            pct: counts.total > 0 ? Math.round((counts.present / counts.total) * 100) : null,
        };
    });

    return { success: true as const, rows };
}
