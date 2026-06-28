'use server';

import db from '@/lib/db';
import { getSession } from '@/lib/session';
import { hasPermission } from '@/lib/authz';
import { hashPassword } from '@/lib/auth';
import { checkStudentLimit } from '@/actions/subscription';
import { generateRollNumber } from '@/lib/utils/roll-number';
import { z } from 'zod';

// ── Shared ─────────────────────────────────────────────────────────────────────

export type ImportResult = {
    succeeded: number;
    failed: { row: number; name: string; reason: string }[];
};

// ── Student import ─────────────────────────────────────────────────────────────

export type StudentImportRow = {
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

/** @deprecated Use StudentImportRow */
export type ImportRow = StudentImportRow;

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

export async function importStudents(rows: StudentImportRow[]): Promise<ImportResult> {
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
                const remaining = rows.slice(rows.indexOf(row) + 1);
                remaining.forEach((r) => result.failed.push({ row: r.row, name: r.name, reason: 'Plan limit reached' }));
                break;
            }

            // Hash passwords BEFORE the transaction — bcrypt is CPU-intensive and
            // will exceed Prisma's 5 s interactive-transaction timeout if run inside it.
            const hashedGuardianPass = await hashPassword(d.guardianContact);
            const hashedStudentPass = await hashPassword(d.bFormNumber);

            // Check whether the guardian already exists so we know whether we need
            // the guardian hash (avoids wasted work on subsequent siblings).
            const existingGuardian = await db.guardian.findUnique({
                where: { cnic_schoolId: { cnic: d.guardianCnic, schoolId: session.schoolId! } },
                select: { id: true },
            });

            await db.$transaction(async (tx) => {
                let guardian = existingGuardian
                    ? await tx.guardian.findUnique({ where: { id: existingGuardian.id }, select: { id: true } })
                    : null;

                if (!guardian) {
                    guardian = await tx.guardian.create({
                        data: {
                            name: d.guardianName,
                            relation: d.guardianRelation,
                            cnic: d.guardianCnic,
                            dateOfBirth: new Date('1980-01-01'),
                            contact: d.guardianContact,
                            schoolId: session.schoolId!,
                        },
                        select: { id: true },
                    });

                    const parentUser = await tx.user.create({
                        data: {
                            username: d.guardianCnic,
                            password: hashedGuardianPass,
                            role: 'Parent',
                            schoolId: session.schoolId!,
                            isActive: true,
                        },
                        select: { id: true },
                    });
                    await tx.guardian.update({
                        where: { id: guardian.id },
                        data: { user: { connect: { id: parentUser.id } } },
                    });
                }

                const existingCount = await tx.student.count({ where: { classId: cls.id, schoolId: session.schoolId! } });
                const rollNumber = generateRollNumber(String(cls.hexCode), new Date(d.dateOfAdmission), existingCount);
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
                        guardianId: guardian!.id,
                        schoolId: session.schoolId!,
                        isActive: true,
                    },
                    select: { id: true, rollNumber: true },
                });

                const studentUser = await tx.user.create({
                    data: {
                        username: student.rollNumber,
                        password: hashedStudentPass,
                        role: 'Student',
                        schoolId: session.schoolId!,
                        studentId: student.id,
                        isActive: true,
                    },
                    select: { id: true },
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

// ── Teacher import ─────────────────────────────────────────────────────────────

export type TeacherImportRow = {
    row: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    gender: string;
    cnic: string;
    qualification: string;
    subject: string;
    experience: string;
    joiningDate: string;
    salary: string;
    address: string;
};

const teacherRowSchema = z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(10, 'Phone must be at least 10 digits'),
    gender: z.enum(['Male', 'Female']),
    cnic: z.string().min(13, 'CNIC must be at least 13 characters'),
    qualification: z.string().min(1, 'Qualification is required'),
    subject: z.string().min(1, 'Subject is required'),
    experience: z.string().optional(),
    joiningDate: z.string().min(1, 'Joining date is required'),
    salary: z.coerce.number().min(0),
    address: z.string().optional(),
});

export async function importTeachers(rows: TeacherImportRow[]): Promise<ImportResult> {
    const session = await getSession();
    if (!session.schoolId || !(await hasPermission('teachers', 'create'))) {
        return { succeeded: 0, failed: rows.map((r) => ({ row: r.row, name: `${r.firstName} ${r.lastName}`, reason: 'Access denied' })) };
    }

    const result: ImportResult = { succeeded: 0, failed: [] };

    for (const row of rows) {
        const displayName = `${row.firstName} ${row.lastName}`.trim() || `Row ${row.row}`;
        try {
            const parsed = teacherRowSchema.safeParse(row);
            if (!parsed.success) {
                result.failed.push({ row: row.row, name: displayName, reason: parsed.error.issues[0]?.message ?? 'Validation failed' });
                continue;
            }

            const d = parsed.data;

            // Hash outside the transaction — bcrypt blocks the event loop long
            // enough to exceed Prisma's 5 s interactive-transaction timeout.
            const hashedPass = await hashPassword(d.phone);

            await db.$transaction(async (tx) => {
                const teacher = await tx.teacher.create({
                    data: {
                        schoolId: session.schoolId!,
                        firstName: d.firstName,
                        lastName: d.lastName,
                        email: d.email,
                        phone: d.phone,
                        gender: d.gender,
                        cnic: d.cnic,
                        qualification: d.qualification,
                        subject: d.subject,
                        experience: d.experience || null,
                        joiningDate: new Date(d.joiningDate),
                        salary: d.salary,
                        address: d.address || null,
                        salaryExtras: [],
                    },
                    select: { id: true },
                });

                const teacherUser = await tx.user.create({
                    data: {
                        username: d.cnic,
                        password: hashedPass,
                        role: 'Teacher',
                        schoolId: session.schoolId!,
                        teacherId: teacher.id,
                        isActive: true,
                    },
                    select: { id: true },
                });
                await tx.teacher.update({ where: { id: teacher.id }, data: { user: { connect: { id: teacherUser.id } } } });
            });

            result.succeeded++;
        } catch (err: any) {
            const reason = err?.code === 'P2002'
                ? 'Duplicate CNIC or email — teacher already exists'
                : (err?.message ?? 'Unknown error');
            result.failed.push({ row: row.row, name: displayName, reason });
        }
    }

    return result;
}

// ── Staff import ───────────────────────────────────────────────────────────────

export type StaffImportRow = {
    row: number;
    name: string;
    fatherName: string;
    cnic: string;
    dateOfBirth: string;
    contact: string;
    gender: string;
    role: string;
    workingHours: string;
    salary: string;
};

const staffRowSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    fatherName: z.string().min(1, "Father's name is required"),
    cnic: z.string().min(13, 'CNIC must be at least 13 characters'),
    dateOfBirth: z.string().min(1, 'Date of birth is required'),
    contact: z.string().min(10, 'Contact must be at least 10 digits'),
    gender: z.enum(['Male', 'Female']),
    role: z.string().min(1, 'Role is required'),
    workingHours: z.string().min(1, 'Working hours are required'),
    salary: z.coerce.number().min(0),
});

export async function importStaff(rows: StaffImportRow[]): Promise<ImportResult> {
    const session = await getSession();
    if (!session.schoolId || !(await hasPermission('staff', 'create'))) {
        return { succeeded: 0, failed: rows.map((r) => ({ row: r.row, name: r.name, reason: 'Access denied' })) };
    }

    const result: ImportResult = { succeeded: 0, failed: [] };

    for (const row of rows) {
        try {
            const parsed = staffRowSchema.safeParse(row);
            if (!parsed.success) {
                result.failed.push({ row: row.row, name: row.name, reason: parsed.error.issues[0]?.message ?? 'Validation failed' });
                continue;
            }

            const d = parsed.data;

            await db.staff.create({
                data: {
                    schoolId: session.schoolId!,
                    name: d.name,
                    fatherName: d.fatherName,
                    cnic: d.cnic,
                    dateOfBirth: new Date(d.dateOfBirth),
                    contact: d.contact,
                    gender: d.gender as 'Male' | 'Female',
                    role: d.role,
                    workingHours: d.workingHours,
                    salary: d.salary,
                    salaryExtras: [],
                },
            });

            result.succeeded++;
        } catch (err: any) {
            const reason = err?.code === 'P2002'
                ? 'Duplicate CNIC — staff member already exists'
                : (err?.message ?? 'Unknown error');
            result.failed.push({ row: row.row, name: row.name, reason });
        }
    }

    return result;
}
