import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import db from '@/lib/db';
import { CalendarClient } from './calendar-client';

export const runtime = 'nodejs';

export default async function CalendarPage({
    searchParams,
}: {
    searchParams: Promise<{ year?: string; month?: string }>;
}) {
    const session = await getSession();
    if (!session.schoolId) redirect('/login');

    const now = new Date();
    const { year: yearStr, month: monthStr } = await searchParams;
    const year = parseInt(yearStr ?? String(now.getFullYear()), 10);
    const month = parseInt(monthStr ?? String(now.getMonth() + 1), 10);

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    const events = await db.event.findMany({
        where: { schoolId: session.schoolId, startDate: { gte: start, lte: end } },
        orderBy: { startDate: 'asc' },
    });

    const canManage = !!(session.role === 'SchoolAdmin' || session.isSuperAdmin);

    return (
        <CalendarClient
            year={year}
            month={month}
            events={events.map((e) => ({
                id: e.id,
                title: e.title,
                description: e.description ?? '',
                startDate: e.startDate.toISOString(),
                endDate: e.endDate.toISOString(),
                isAllDay: e.isAllDay,
                color: e.color ?? '#7c3aed',
            }))}
            canManage={canManage}
        />
    );
}
