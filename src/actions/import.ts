'use server';

import db from '@/lib/db';
import { getSession } from '@/lib/session';
import { hasPermission } from '@/lib/authz';
import { hashPassword } from '@/lib/auth';
import { checkStudentLimit } from '@/actions/subscription';
import { generateRollNumber } from '@/lib/utils/roll-number';
import { z } from 'zod';

export type ImportRow = {
    row: number;
    name: string;
    gender: string;
    dateOfBirth: string;
    dateOfAdmission: string;
    bFormNumber: string;
    className: string;
    monthlyFees: string;
    guardianName: string;
    guardianCnic: string;
    guardianContact: string;
    guardianRelation: string;
};

export type ImportResult = {
    succeeded: number;
    failed: { row: number; name: string; reason: string }[];
};

const rowSchema = z.object({
    name: z.string().min(1),
    gender: z.enum(['Male', 'Female']),
    dateOfBirth: z.string().min(1),
    dateOfAdmission: z.string().min(1),
    bFormNumber: z.string().min(1),
    className: z.string().min(1),
    monthlyFees: z.coerce.number().min(0),
    guardianName: z.string().min(1),
    guardianCnic: z.string().min(13),
    guardianContact: z.string().min(10),
    guardianRelation: z.string().min(1),
});

export async function importStudents(rows: ImportRow[]): Promise<ImportResult> {
    const session = await getSession();
    if (!session.schoolId || !(await hasPermission('students', 'create'))) {
        return { succeeded: 0, failed: rows.map((r) => ({ row: r.row, name: r.name, reason: 'Access denied' })) };
    }

    const result: ImportResult = { succeeded: 0, failed: [] };

    // Build class lookup map once
    const classes = await db.class.findMany({
        where: { schoolId: session.schoolId, isActive: true },
        select: { id: true, name: true, section: true, hexCode: true, gradeLevel: true },
    });
    const classMap = new Map(classes.map((c) => [c.name.toLowerCase().trim(), c]));

    for (const row of rows) {
        try {
            const parsed = rowSchema.safeParse(row);
            if (!parsed.success) {
                result.failed.push({ row: row.row, name: row.name, reason: parsed.error.issues[0]?.message ?? 'Validation failed' });
                continue;
            }

            const d = parsed.data;
            const cls = classMap.get(d.className.toLowerCase().trim());
            if (!cls) {
                result.failed.push({ row: row.row, name: d.name, reason: `Class "${d.className}" not found in this school` });
                continue;
            }

            // Check plan limit
            const limitCheck = await checkStudentLimit(session.schoolId);
            if (!limitCheck.allowed) {
                result.failed.push({ row: row.row, name: d.name, reason: limitCheck.message ?? 'Plan limit reached' });
                // Stop further processing — limit hit
                const remaining = rows.slice(rows.indexOf(row) + 1);
                remaining.forEach((r) => result.failed.push({ row: r.row, name: r.name, reason: 'Plan limit reached' }));
                break;
            }

            await db.$transaction(async (tx) => {
                // Guardian: find or create
                let guardian = await tx.guardian.findUnique({
                    where: { cnic_schoolId: { cnic: d.guardianCnic, schoolId: session.schoolId! } },
                });
                if (!guardian) {
                    guardian = await tx.guardian.create({
                        data: {
                            name: d.guardianName,
                            relation: d.guardianRelation,
                            cnic: d.guardianCnic,
                            dateOfBirth: new Date('1980-01-01'), // placeholder
                            contact: d.guardianContact,
                            schoolId: session.schoolId!,
                        },
                    });

                    // Create parent portal user
                    const hashedPass = await hashPassword(d.guardianContact);
                    const parentUser = await tx.user.create({
                        data: {
                            username: d.guardianCnic,
                            password: hashedPass,
                            role: 'Parent',
                            schoolId: session.schoolId!,
                            isActive: true,
                        },
                    });
                    await tx.guardian.update({
                        where: { id: guardian.id },
                        data: { user: { connect: { id: parentUser.id } } },
                    });
                }

                // Roll number
                const existingCount = await tx.student.count({ where: { classId: cls.id, schoolId: session.schoolId! } });
                const rollNumber = generateRollNumber(
                    String(cls.hexCode),
                    new Date(d.dateOfAdmission),
                    existingCount,
                );

                const finalFee = d.monthlyFees;

                const student = await tx.student.create({
                    data: {
                        name: d.name,
                        gender: d.gender as 'Male' | 'Female',
                        dateOfBirth: new Date(d.dateOfBirth),
                        dateOfAdmission: new Date(d.dateOfAdmission),
                        bFormNumber: d.bFormNumber,
                        rollNumber,
                        monthlyFees: finalFee,
                        discountPercentage: 0,
                        finalFee,
                        classId: cls.id,
                        guardianId: guardian.id,
                        schoolId: session.schoolId!,
                        isActive: true,
                    },
                });

                // Student portal user
                const hashedPass = await hashPassword(d.bFormNumber);
                const studentUser = await tx.user.create({
                    data: {
                        username: student.rollNumber,
                        password: hashedPass,
                        role: 'Student',
                        schoolId: session.schoolId!,
                        studentId: student.id,
                        isActive: true,
                    },
                });
                await tx.student.update({ where: { id: student.id }, data: { user: { connect: { id: studentUser.id } } } });
            });

            result.succeeded++;
        } catch (err: any) {
            result.failed.push({ row: row.row, name: row.name, reason: err?.message ?? 'Unknown error' });
        }
    }

    return result;
}
