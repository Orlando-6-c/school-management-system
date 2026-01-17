'use server';

import { getSession } from '@/lib/session';
import db from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

const updateSchoolNameSchema = z.object({
    name: z.string().min(1, 'School name is required'),
});

const updateSessionYearSchema = z.object({
    year: z.coerce.number().int().min(2000).max(2100),
    startDate: z.string().transform((str) => new Date(str)),
    endDate: z.string().transform((str) => new Date(str)),
});

const updateCurrencySchema = z.object({
    currencyCode: z.string().min(1, 'Currency code is required'),
    currencySymbol: z.string().min(1, 'Currency symbol is required'),
});

const updateLogoSchema = z.object({
    logo: z.string().url('Invalid logo URL').optional().or(z.literal('')),
});

export type SettingsState = {
    success?: boolean;
    message?: string;
    errors?: Record<string, string[]>;
};

export async function updateSchoolName(prevState: SettingsState | undefined, formData: FormData): Promise<SettingsState> {
    const session = await getSession();
    if (!session.schoolId || (session.role !== 'SchoolAdmin' && !session.isSuperAdmin)) {
        return { success: false, message: 'Unauthorized' };
    }

    const result = updateSchoolNameSchema.safeParse(Object.fromEntries(formData));

    if (!result.success) {
        return {
            errors: result.error.flatten().fieldErrors,
            message: 'Validation failed.',
        };
    }

    try {
        await db.school.update({
            where: { id: session.schoolId },
            data: { name: result.data.name },
        });

        revalidatePath('/school/settings');
        revalidatePath('/school');
        return { success: true, message: 'School name updated successfully.' };
    } catch (error: any) {
        console.error('Update School Name Error:', error);
        return { success: false, message: 'Failed to update school name.' };
    }
}

export async function updateSessionYear(prevState: SettingsState | undefined, formData: FormData): Promise<SettingsState> {
    const session = await getSession();
    if (!session.schoolId || (session.role !== 'SchoolAdmin' && !session.isSuperAdmin)) {
        return { success: false, message: 'Unauthorized' };
    }

    const result = updateSessionYearSchema.safeParse(Object.fromEntries(formData));

    if (!result.success) {
        return {
            errors: result.error.flatten().fieldErrors,
            message: 'Validation failed.',
        };
    }

    try {
        await db.$transaction(async (tx) => {
            // Set all existing financial years for this school to not current
            await tx.financialYear.updateMany({
                where: { schoolId: session.schoolId! },
                data: { isCurrent: false },
            });

            // Check if financial year already exists for this school
            const existing = await tx.financialYear.findFirst({
                where: {
                    schoolId: session.schoolId!,
                    year: result.data.year,
                },
            });

            if (existing) {
                // Update existing
                await tx.financialYear.update({
                    where: { id: existing.id },
                    data: {
                        startDate: result.data.startDate,
                        endDate: result.data.endDate,
                        isCurrent: true,
                    },
                });
            } else {
                // Create new
                await tx.financialYear.create({
                    data: {
                        schoolId: session.schoolId!,
                        year: result.data.year,
                        startDate: result.data.startDate,
                        endDate: result.data.endDate,
                        isCurrent: true,
                    },
                });
            }
        });

        revalidatePath('/school/settings');
        return { success: true, message: 'Session year updated successfully.' };
    } catch (error: any) {
        console.error('Update Session Year Error:', error);
        if (error.code === 'P2002') {
            return { success: false, message: 'A financial year with this year already exists.' };
        }
        return { success: false, message: 'Failed to update session year.' };
    }
}

export async function updateCurrency(prevState: SettingsState | undefined, formData: FormData): Promise<SettingsState> {
    const session = await getSession();
    if (!session.schoolId || (session.role !== 'SchoolAdmin' && !session.isSuperAdmin)) {
        return { success: false, message: 'Unauthorized' };
    }

    const result = updateCurrencySchema.safeParse(Object.fromEntries(formData));

    if (!result.success) {
        return {
            errors: result.error.flatten().fieldErrors,
            message: 'Validation failed.',
        };
    }

    try {
        // Check if currency configuration exists
        const existing = await db.currencyConfiguration.findUnique({
            where: { schoolId: session.schoolId! },
        });

        if (existing) {
            await db.currencyConfiguration.update({
                where: { id: existing.id },
                data: {
                    currencyCode: result.data.currencyCode,
                    currencySymbol: result.data.currencySymbol,
                },
            });
        } else {
            await db.currencyConfiguration.create({
                data: {
                    schoolId: session.schoolId!,
                    currencyCode: result.data.currencyCode,
                    currencySymbol: result.data.currencySymbol,
                },
            });
        }

        revalidatePath('/school/settings');
        return { success: true, message: 'Currency configuration updated successfully.' };
    } catch (error: any) {
        console.error('Update Currency Error:', error);
        return { success: false, message: 'Failed to update currency configuration.' };
    }
}

export async function updateLogo(prevState: SettingsState | undefined, formData: FormData): Promise<SettingsState> {
    const session = await getSession();
    if (!session.schoolId || (session.role !== 'SchoolAdmin' && !session.isSuperAdmin)) {
        return { success: false, message: 'Unauthorized' };
    }

    const result = updateLogoSchema.safeParse(Object.fromEntries(formData));

    if (!result.success) {
        return {
            errors: result.error.flatten().fieldErrors,
            message: 'Validation failed.',
        };
    }

    try {
        await db.school.update({
            where: { id: session.schoolId },
            data: { logo: result.data.logo || null },
        });

        revalidatePath('/school/settings');
        revalidatePath('/school');
        return { success: true, message: 'Logo updated successfully.' };
    } catch (error: any) {
        console.error('Update Logo Error:', error);
        return { success: false, message: 'Failed to update logo.' };
    }
}

export async function getSchoolSettings() {
    const session = await getSession();
    if (!session.schoolId) {
        return null;
    }

    try {
        const school = await db.school.findUnique({
            where: { id: session.schoolId },
            include: {
                currencyConfigurations: true,
                financialYears: {
                    where: { isCurrent: true },
                    orderBy: { year: 'desc' },
                    take: 1,
                },
            },
        });

        if (!school) {
            return null;
        }

        return {
            name: school.name,
            logo: school.logo,
            currency: school.currencyConfigurations[0] || null,
            currentFinancialYear: school.financialYears[0] || null,
        };
    } catch (error: any) {
        console.error('Get School Settings Error:', error);
        return null;
    }
}
