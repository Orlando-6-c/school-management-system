'use server';

import { getSession } from '@/lib/session';
import db from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { generateRollNumber } from '@/lib/utils/roll-number';
import { hashPassword } from '@/lib/auth';
import { z } from 'zod';

const studentSchema = z.object({
    // Guardian Info
    guardianCnic: z.string().min(13, "CNIC must be at least 13 characters"), // Basic length check
    guardianName: z.string().min(3),
    guardianRelation: z.string().min(1),
    guardianContact: z.string().min(10),
    guardianEmail: z.string().email().optional().or(z.literal('')),

    // Student Info
    name: z.string().min(3),
    gender: z.enum(['Male', 'Female']),
    dateOfBirth: z.string().transform((str) => new Date(str)),
    dateOfAdmission: z.string().transform((str) => new Date(str)), // Should default to today in UI
    bFormNumber: z.string().min(1),
    photograph: z.string().optional(), // URL
    classId: z.string().min(1),

    // Financials
    monthlyFees: z.coerce.number().min(0), // Updated from annualFee
    discountPercentage: z.coerce.number().min(0).max(100),
});

export type AdmissionState = {
    success?: boolean;
    message?: string;
    errors?: Record<string, string[]>;
    studentId?: string;
};

export async function getGuardianByCNIC(cnic: string) {
    const session = await getSession();
    if (!session.schoolId) return null;

    const guardian = await db.guardian.findUnique({
        where: {
            cnic_schoolId: {
                cnic: cnic,
                schoolId: session.schoolId
            }
        },
        select: {
            name: true,
            relation: true,
            contact: true,
            email: true
        }
    });

    return guardian;
}

export async function admitStudent(prevState: AdmissionState | undefined, formData: FormData): Promise<AdmissionState> {
    const session = await getSession();
    if (!session.userId || !session.schoolId) {
        return { message: 'Unauthorized' };
    }

    const result = studentSchema.safeParse(Object.fromEntries(formData));

    if (!result.success) {
        // console.log("Validation Errors:", result.error.flatten().fieldErrors);
        return {
            errors: result.error.flatten().fieldErrors,
            message: 'Validation failed'
        };
    }

    const data = result.data;

    try {
        // 1. Find or Create Guardian (SRS 3.2.4 Sibling Management)
        let guardian = await db.guardian.findUnique({
            where: {
                cnic_schoolId: {
                    cnic: data.guardianCnic,
                    schoolId: session.schoolId
                }
            }
        });

        if (!guardian) {
            guardian = await db.guardian.create({
                data: {
                    schoolId: session.schoolId,
                    name: data.guardianName,
                    cnic: data.guardianCnic,
                    relation: data.guardianRelation,
                    contact: data.guardianContact,
                    email: data.guardianEmail || null,
                    dateOfBirth: new Date(),
                }
            });
        }

        // 2. Generate Roll Number (SRS 3.2.2)
        // Try finding by ID first
        let classData = await db.class.findUnique({
            where: { id: data.classId }
        });

        // If not found by ID (legacy support needed?), try name, but with Dropdown ID is preferred.
        if (!classData) {
            classData = await db.class.findFirst({
                where: {
                    schoolId: session.schoolId,
                    name: data.classId
                }
            });
        }

        if (!classData) return { message: 'Invalid Class' };

        // Count students in this class for sequence
        const currentCount = await db.student.count({
            where: {
                schoolId: session.schoolId,
                classId: classData.id
            }
        });

        const rollNumber = generateRollNumber(
            classData.hexCode,
            data.dateOfAdmission,
            currentCount
        );

        // 3. Create Student (SRS 3.2.1)
        const finalFee = data.monthlyFees * (1 - data.discountPercentage / 100); // Updated calculation base

        const newStudent = await db.$transaction(async (tx) => {
            const student = await tx.student.create({
                data: {
                    schoolId: session.schoolId!,
                    guardianId: guardian!.id,
                    classId: classData!.id,
                    name: data.name,
                    rollNumber: rollNumber,
                    gender: data.gender,
                    dateOfBirth: data.dateOfBirth,
                    dateOfAdmission: data.dateOfAdmission,
                    bFormNumber: data.bFormNumber,
                    photograph: data.photograph || null,
                    monthlyFees: data.monthlyFees, // Updated field
                    discountPercentage: data.discountPercentage,
                    finalFee: finalFee,
                }
            });

            // 4. Create User Account (Role: STUDENT - ReadOnly for now)
            // Username: RollNumber
            const hashedPassword = await hashPassword(student.rollNumber);

            await tx.user.create({
                data: {
                    schoolId: session.schoolId!,
                    username: student.rollNumber,
                    password: hashedPassword,
                    role: 'ReadOnly',
                }
            });

            return student;
        });

        revalidatePath('/school/students');
        return { success: true, message: 'Student admitted successfully', studentId: newStudent.id };

    } catch (error: any) {
        console.error(error);
        if (error.code === 'P2002') {
            return { message: 'Duplicate record (Roll No or B-Form or User)' };
        }
        return { message: 'Failed to admit student' };
    }
}

export async function updateStudent(id: string, prevState: AdmissionState | undefined, formData: FormData): Promise<AdmissionState> {
    const session = await getSession();
    if (!session.userId || !session.schoolId) {
        return { message: 'Unauthorized' };
    }

    const result = studentSchema.safeParse(Object.fromEntries(formData));

    if (!result.success) {
        return {
            errors: result.error.flatten().fieldErrors,
            message: 'Validation failed'
        };
    }

    const data = result.data;

    try {
        // 1. Find or Create Guardian (if changed)
        let guardian = await db.guardian.findUnique({
            where: {
                cnic_schoolId: {
                    cnic: data.guardianCnic,
                    schoolId: session.schoolId
                }
            }
        });

        if (!guardian) {
            guardian = await db.guardian.create({
                data: {
                    schoolId: session.schoolId,
                    name: data.guardianName,
                    cnic: data.guardianCnic,
                    relation: data.guardianRelation,
                    contact: data.guardianContact,
                    email: data.guardianEmail || null,
                    dateOfBirth: new Date(), // Simple default, realistically should be provided
                }
            });
        } else {
            // Update guardian details if needed? For now, let's assume we update contact info
            await db.guardian.update({
                where: { id: guardian.id },
                data: {
                    name: data.guardianName,
                    relation: data.guardianRelation,
                    contact: data.guardianContact,
                    email: data.guardianEmail || null,
                }
            });
        }

        // 2. Resolve Class
        let classData = await db.class.findUnique({ where: { id: data.classId } });
        if (!classData) {
            classData = await db.class.findFirst({
                where: { schoolId: session.schoolId, name: data.classId }
            });
        }
        if (!classData) return { message: 'Invalid Class' };

        // 3. Update Student
        const finalFee = data.monthlyFees * (1 - data.discountPercentage / 100);

        await db.student.update({
            where: {
                id: id,
                schoolId: session.schoolId // Ensure ownership
            },
            data: {
                guardianId: guardian.id,
                classId: classData.id,
                name: data.name,
                gender: data.gender,
                dateOfBirth: data.dateOfBirth,
                dateOfAdmission: data.dateOfAdmission,
                bFormNumber: data.bFormNumber,
                photograph: data.photograph || null,
                monthlyFees: data.monthlyFees,
                discountPercentage: data.discountPercentage,
                finalFee: finalFee,
            }
        });

        revalidatePath('/school/students');
        revalidatePath(`/school/students/${id}`);
        return { success: true, message: 'Student updated successfully' };

    } catch (error: any) {
        console.error(error);
        if (error.code === 'P2002') {
            return { message: 'Duplicate record (B-Form or User)' };
        }
        return { message: 'Failed to update student' };
    }
}

export async function deleteStudent(studentId: string, reason?: string) {
    const session = await getSession();
    if (session.role !== 'SchoolAdmin' || !session.schoolId) {
        return { success: false, message: 'Unauthorized' };
    }

    try {
        await db.$transaction(async (tx) => {
            const student = await tx.student.update({
                where: { id: studentId, schoolId: session.schoolId },
                data: {
                    isActive: false,
                    deletedAt: new Date(),
                },
            });

            if (!student) {
                throw new Error('Student not found or not part of this school.');
            }

            // Also deactivate the corresponding user account
            await tx.user.updateMany({
                where: {
                    username: student.rollNumber,
                    schoolId: session.schoolId,
                },
                data: {
                    isActive: false,
                },
            });

            // Create audit log entry
            await tx.auditLog.create({
                data: {
                    schoolId: session.schoolId,
                    actorId: session.userId,
                    actorType: 'User', // Assuming admin is a 'User'
                    action: 'soft_delete_student',
                    targetId: student.id,
                    targetType: 'Student',
                    reason: reason,
                },
            });
        });

        revalidatePath('/school/students');
        return { success: true, message: 'Student deleted successfully.' };
    } catch (error: any) {
    }

export async function getStudents(schoolId: string) {
    try {
        const students = await db.student.findMany({
            where: { schoolId: schoolId, isActive: true },
            include: {
                class: {
                    select: {
                        id: true,
                        name: true,
                        section: true,
                    },
                },
                guardian: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: { name: 'asc' },
        });
        return students;
    } catch (error) {
        console.error('Error fetching students:', error);
        return [];
    }
}
