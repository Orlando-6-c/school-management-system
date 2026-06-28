'use server';

import db from '@/lib/db';
import { getSession } from '@/lib/session';
import { PLANS, TRIAL_DAYS, type PlanTier } from '@/lib/plans';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

// ── Internal helpers ──────────────────────────────────────────────────────────

/** Returns the subscription for a school, or null. Used inside server actions — not exported to client. */
export async function getSubscriptionRaw(schoolId: string) {
    return db.subscription.findUnique({ where: { schoolId } });
}

/** Creates a trial subscription for a newly registered school. */
export async function createTrialSubscription(tx: Parameters<Parameters<typeof db.$transaction>[0]>[0], schoolId: string) {
    const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
    return tx.subscription.create({
        data: { schoolId, plan: 'Trial', status: 'Trial', trialEndsAt },
    });
}

// ── School-facing ─────────────────────────────────────────────────────────────

export type SubscriptionInfo = {
    plan: PlanTier;
    status: string;
    trialEndsAt: Date | null;
    currentPeriodEnd: Date | null;
    studentCount: number;
    userCount: number;
    maxStudents: number;
    maxUsers: number;
};

export async function getSchoolSubscription(): Promise<SubscriptionInfo | null> {
    const session = await getSession();
    if (!session.schoolId) return null;

    const [sub, studentCount, userCount] = await Promise.all([
        db.subscription.findUnique({ where: { schoolId: session.schoolId } }),
        db.student.count({ where: { schoolId: session.schoolId, isActive: true } }),
        db.user.count({ where: { schoolId: session.schoolId, isActive: true } }),
    ]);

    if (!sub) return null;

    const plan = sub.plan as PlanTier;
    const limits = PLANS[plan];

    return {
        plan,
        status: sub.status,
        trialEndsAt: sub.trialEndsAt,
        currentPeriodEnd: sub.currentPeriodEnd,
        studentCount,
        userCount,
        maxStudents: limits.maxStudents === Infinity ? -1 : limits.maxStudents,
        maxUsers: limits.maxUsers === Infinity ? -1 : limits.maxUsers,
    };
}

// ── Limit checks (used inside other server actions) ───────────────────────────

export async function checkStudentLimit(schoolId: string): Promise<{ allowed: boolean; message?: string }> {
    const sub = await getSubscriptionRaw(schoolId);
    if (!sub) return { allowed: true }; // No subscription = legacy school, allow

    const plan = sub.plan as PlanTier;
    const max = PLANS[plan].maxStudents;
    if (max === Infinity) return { allowed: true };

    // Check if trial is expired
    if (sub.status === 'Trial' && sub.trialEndsAt < new Date()) {
        return { allowed: false, message: 'Your free trial has expired. Please contact us to upgrade your plan.' };
    }
    if (sub.status === 'Expired' || sub.status === 'Cancelled') {
        return { allowed: false, message: 'Your subscription is inactive. Please contact us to reactivate.' };
    }

    const count = await db.student.count({ where: { schoolId, isActive: true } });
    if (count >= max) {
        return {
            allowed: false,
            message: `Student limit reached: your ${PLANS[plan].label} plan allows up to ${max} students. Please upgrade.`,
        };
    }
    return { allowed: true };
}

export async function checkUserLimit(schoolId: string): Promise<{ allowed: boolean; message?: string }> {
    const sub = await getSubscriptionRaw(schoolId);
    if (!sub) return { allowed: true };

    const plan = sub.plan as PlanTier;
    const max = PLANS[plan].maxUsers;
    if (max === Infinity) return { allowed: true };

    if (sub.status === 'Trial' && sub.trialEndsAt < new Date()) {
        return { allowed: false, message: 'Your free trial has expired. Please contact us to upgrade your plan.' };
    }
    if (sub.status === 'Expired' || sub.status === 'Cancelled') {
        return { allowed: false, message: 'Your subscription is inactive. Please contact us to reactivate.' };
    }

    const count = await db.user.count({ where: { schoolId, isActive: true } });
    if (count >= max) {
        return {
            allowed: false,
            message: `User limit reached: your ${PLANS[plan].label} plan allows up to ${max} user accounts. Please upgrade.`,
        };
    }
    return { allowed: true };
}

// ── SuperAdmin billing ────────────────────────────────────────────────────────

export type AdminSubscriptionRow = {
    schoolId: string;
    schoolName: string;
    schoolSlug: string;
    plan: PlanTier;
    status: string;
    trialEndsAt: Date | null;
    currentPeriodEnd: Date | null;
    studentCount: number;
    userCount: number;
    createdAt: Date;
    notes: string | null;
};

export async function getAllSubscriptions(): Promise<AdminSubscriptionRow[]> {
    const session = await getSession();
    if (!session.isSuperAdmin) return [];

    const schools = await db.school.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            subscription: true,
            _count: { select: { students: true, users: true } },
        },
    });

    return schools.map((s) => ({
        schoolId: s.id,
        schoolName: s.name,
        schoolSlug: s.slug,
        plan: (s.subscription?.plan ?? 'Trial') as PlanTier,
        status: s.subscription?.status ?? 'Trial',
        trialEndsAt: s.subscription?.trialEndsAt ?? null,
        currentPeriodEnd: s.subscription?.currentPeriodEnd ?? null,
        studentCount: s._count.students,
        userCount: s._count.users,
        createdAt: s.createdAt,
        notes: s.subscription?.notes ?? null,
    }));
}

const updatePlanSchema = z.object({
    schoolId: z.string().min(1),
    plan: z.enum(['Trial', 'Starter', 'School', 'District']),
    status: z.enum(['Trial', 'Active', 'Expired', 'Cancelled']),
    notes: z.string().optional(),
    periodMonths: z.coerce.number().int().min(1).max(36).optional(),
});

export type UpdatePlanState = { success?: boolean; message?: string };

export async function updateSchoolPlan(
    prevState: UpdatePlanState | undefined,
    formData: FormData,
): Promise<UpdatePlanState> {
    const session = await getSession();
    if (!session.isSuperAdmin) return { message: 'Unauthorized' };

    const result = updatePlanSchema.safeParse(Object.fromEntries(formData));
    if (!result.success) return { message: result.error.issues[0]?.message ?? 'Invalid input' };

    const { schoolId, plan, status, notes, periodMonths } = result.data;

    const now = new Date();
    const currentPeriodStart = status === 'Active' ? now : undefined;
    const currentPeriodEnd =
        status === 'Active' && periodMonths
            ? new Date(now.getFullYear(), now.getMonth() + periodMonths, now.getDate())
            : undefined;

    await db.subscription.upsert({
        where: { schoolId },
        create: {
            schoolId,
            plan,
            status,
            trialEndsAt: new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000),
            currentPeriodStart,
            currentPeriodEnd,
            notes,
        },
        update: {
            plan,
            status,
            ...(currentPeriodStart ? { currentPeriodStart } : {}),
            ...(currentPeriodEnd ? { currentPeriodEnd } : {}),
            ...(status === 'Cancelled' ? { cancelledAt: now } : {}),
            notes,
        },
    });

    revalidatePath('/admin/billing');
    return { success: true, message: `Plan updated to ${PLANS[plan].label} (${status})` };
}
