'use server';

import db from '@/lib/db';
import { getSession } from '@/lib/session';
import { hasPermission } from '@/lib/authz';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const eventSchema = z.object({
    title: z.string().min(1, 'Title is required').max(100),
    description: z.string().optional(),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    isAllDay: z.coerce.boolean().default(false),
    color: z.string().optional().default('#7c3aed'),
});

export type EventFormState = { success?: boolean; message?: string; errors?: Record<string, string[]> };

export async function getEvents(year: number, month: number) {
    const session = await getSession();
    if (!session.schoolId) return [];

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    return db.event.findMany({
        where: { schoolId: session.schoolId, startDate: { gte: start, lte: end } },
        orderBy: { startDate: 'asc' },
    });
}

export async function getUpcomingEvents(limit = 5) {
    const session = await getSession();
    if (!session.schoolId) return [];

    return db.event.findMany({
        where: { schoolId: session.schoolId, startDate: { gte: new Date() } },
        orderBy: { startDate: 'asc' },
        take: limit,
    });
}

export async function createEvent(prevState: EventFormState | undefined, formData: FormData): Promise<EventFormState> {
    const session = await getSession();
    if (!session.schoolId || !(await hasPermission('settings', 'create'))) {
        return { message: 'Access denied' };
    }

    const result = eventSchema.safeParse(Object.fromEntries(formData));
    if (!result.success) return { errors: result.error.flatten().fieldErrors };

    const { title, description, startDate, endDate, isAllDay, color } = result.data;

    if (new Date(endDate) < new Date(startDate)) {
        return { errors: { endDate: ['End date must be on or after start date'] } };
    }

    await db.event.create({
        data: {
            title,
            description: description || null,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            isAllDay,
            color,
            schoolId: session.schoolId,
        },
    });

    revalidatePath('/school/calendar');
    return { success: true, message: 'Event created' };
}

export async function updateEvent(id: string, prevState: EventFormState | undefined, formData: FormData): Promise<EventFormState> {
    const session = await getSession();
    if (!session.schoolId || !(await hasPermission('settings', 'edit'))) {
        return { message: 'Access denied' };
    }

    const event = await db.event.findFirst({ where: { id, schoolId: session.schoolId } });
    if (!event) return { message: 'Event not found' };

    const result = eventSchema.safeParse(Object.fromEntries(formData));
    if (!result.success) return { errors: result.error.flatten().fieldErrors };

    const { title, description, startDate, endDate, isAllDay, color } = result.data;

    await db.event.update({
        where: { id },
        data: { title, description: description || null, startDate: new Date(startDate), endDate: new Date(endDate), isAllDay, color },
    });

    revalidatePath('/school/calendar');
    return { success: true, message: 'Event updated' };
}

export async function deleteEvent(id: string): Promise<EventFormState> {
    const session = await getSession();
    if (!session.schoolId || !(await hasPermission('settings', 'delete'))) {
        return { message: 'Access denied' };
    }

    const event = await db.event.findFirst({ where: { id, schoolId: session.schoolId } });
    if (!event) return { message: 'Event not found' };

    await db.event.delete({ where: { id } });
    revalidatePath('/school/calendar');
    return { success: true };
}
