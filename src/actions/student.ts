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
    annualFee: z.coerce.number().min(0),
    discountPercentage: z.coerce.number().min(0).max(100),
});

export type AdmissionState = {
    success?: boolean;
    message?: string;
    errors?: Record<string, string[]>;
    studentId?: string;
};

export async function admitStudent(prevState: AdmissionState | undefined, formData: FormData): Promise<AdmissionState> {
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

        // If not found by ID, try finding by name within this school
        if (!classData) {
            classData = await db.class.findFirst({
                where: {
                    schoolId: session.schoolId,
                    name: data.classId // Assuming input might be the name
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
        const finalFee = data.annualFee * (1 - data.discountPercentage / 100);

        const newStudent = await db.$transaction(async (tx) => {
            const student = await tx.student.create({
                data: {
                    schoolId: session.schoolId,
                    guardianId: guardian!.id,
                    classId: classData!.id, // Use the resolved ID, not data.classId (which might be a name)
                    name: data.name,
                    rollNumber: rollNumber,
                    gender: data.gender,
                    dateOfBirth: data.dateOfBirth,
                    dateOfAdmission: data.dateOfAdmission,
                    bFormNumber: data.bFormNumber,
                    photograph: data.photograph || null,
                    annualFee: data.annualFee,
                    discountPercentage: data.discountPercentage,
                    finalFee: finalFee,
                }
            });

            // 4. Create User Account (Role: STUDENT)
            // Username: RollNumber
            const hashedPassword = await hashPassword(student.rollNumber);

            await tx.user.create({
                data: {
                    schoolId: session.schoolId,
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
