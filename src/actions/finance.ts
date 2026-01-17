'use server';

import { getSession } from '@/lib/session';
import db from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { IncomeCategory, ExpenseCategory, FeeStatus, ChargeType, EmployeeRole, Prisma } from '@prisma/client'; // Import enums and Prisma
import { createAuditLogEntry } from '@/lib/audit';


// Helper to serialize Prisma objects (convert Decimals to numbers)
const serialize = (obj: any): any => {
    if (Array.isArray(obj)) {
        return obj.map(serialize);
    }
    if (typeof obj === 'object' && obj !== null) {
        // Handle Prisma Decimal
        if (obj instanceof Prisma.Decimal) {
            return obj.toNumber();
        }
        // Recursive for other objects
        const newObj: any = {};
        for (const key in obj) {
            newObj[key] = serialize(obj[key]);
        }
        return newObj;
    }
    return obj;
};

// --- Income Management ---

const incomeSchema = z.object({
    description: z.string().min(1, 'Description is required'),
    amount: z.coerce.number().min(0.01, 'Amount must be positive'),
    category: z.nativeEnum(IncomeCategory),
    source: z.string().min(1, 'Source is required'),
    paymentMethod: z.string().min(1, 'Payment method is required'),
    date: z.string().transform((str) => new Date(str)),
    studentId: z.string().optional().or(z.literal('')),
    reference: z.string().optional().or(z.literal('')),
    remarks: z.string().optional().or(z.literal('')),
});

export type IncomeState = {
    success?: boolean;
    message?: string;
    errors?: Record<string, string[]>;
};

export async function addIncome(prevState: IncomeState | undefined, formData: FormData): Promise<IncomeState> {
    const session = await getSession();
    if (!session.schoolId || !(session.role === 'SchoolAdmin' || session.role === 'Finance' || session.role === 'SuperAdmin')) {
        return { message: 'Unauthorized' };
    }

    const rawData: any = Object.fromEntries(formData);

    const result = incomeSchema.safeParse(rawData);

    if (!result.success) {
        return {
            errors: result.error.flatten().fieldErrors,
            message: 'Validation failed.'
        };
    }

    const data = result.data;

    try {
        const newIncome = await db.incomeRecord.create({
            data: {
                schoolId: session.schoolId,
                transactionId: `INC-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`, // Auto-generate
                description: data.description,
                amount: data.amount,
                category: data.category,
                source: data.source,
                paymentMethod: data.paymentMethod,
                date: data.date,
                studentId: data.studentId === '' ? null : data.studentId, // Ensure null for empty string
                reference: data.reference || null,
                remarks: data.remarks || null,
                isAutomatic: false, // Manual entry
            }
        });

        await createAuditLogEntry(
            session,
            'add_income',
            newIncome.id,
            'Income',
            `Added new income record: ${newIncome.description}`
        );

        revalidatePath('/school/finance');
        revalidatePath('/school/finance/income'); // Specific path for income listing
        return { success: true, message: 'Income record added successfully.' };
    } catch (error: any) {
        console.error('Add Income Error:', error);
        return { success: false, message: 'Failed to add income record.' };
    }
}

export async function getIncomeRecords() {
    const session = await getSession();
    if (!session.schoolId || !(session.role === 'SchoolAdmin' || session.role === 'Finance' || session.role === 'SuperAdmin')) {
        return []; // Return empty array if unauthorized or no schoolId
    }

    try {
        const incomeRecords = await db.incomeRecord.findMany({
            where: { schoolId: session.schoolId },
            include: {
                student: {
                    select: {
                        id: true,
                        name: true,
                        rollNumber: true,
                    },
                },
            },
            orderBy: { date: 'desc' },
        });
        return serialize(incomeRecords);
    } catch (error: any) {
        console.error('Get Income Records Error:', error);
        return [];
    }
}


// --- Expense Management ---

const expenseSchema = z.object({
    description: z.string().min(1, 'Description is required'),
    amount: z.coerce.number().min(0.01, 'Amount must be positive'),
    category: z.nativeEnum(ExpenseCategory),
    paidTo: z.string().min(1, 'Recipient is required'),
    paymentMethod: z.string().min(1, 'Payment method is required'),
    date: z.string().transform((str) => new Date(str)),
    reference: z.string().optional().or(z.literal('')),
    remarks: z.string().optional().or(z.literal('')),
});

export type ExpenseState = {
    success?: boolean;
    message?: string;
    errors?: Record<string, string[]>;
};

export async function addExpense(prevState: ExpenseState | undefined, formData: FormData): Promise<ExpenseState> {
    const session = await getSession();
    if (!session.schoolId || !(session.role === 'SchoolAdmin' || session.role === 'Finance' || session.role === 'SuperAdmin')) {
        return { message: 'Unauthorized' };
    }

    const result = expenseSchema.safeParse(Object.fromEntries(formData));

    if (!result.success) {
        return {
            errors: result.error.flatten().fieldErrors,
            message: 'Validation failed.'
        };
    }

    const data = result.data;

    try {
        const newExpense = await db.expenseRecord.create({
            data: {
                schoolId: session.schoolId,
                transactionId: `EXP-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`, // Auto-generate
                description: data.description,
                amount: data.amount,
                category: data.category,
                paidTo: data.paidTo,
                paymentMethod: data.paymentMethod,
                date: data.date,
                reference: data.reference || null,
                remarks: data.remarks || null,
                isAutomatic: false, // Manual entry
            }
        });

        await createAuditLogEntry(
            session,
            'add_expense',
            newExpense.id,
            'Expense',
            `Added new expense record: ${newExpense.description}`
        );

        revalidatePath('/school/finance');
        revalidatePath('/school/finance/expense'); // Specific path for expense listing
        return { success: true, message: 'Expense record added successfully.' };
    } catch (error: any) {
        console.error('Add Expense Error:', error);
        return { success: false, message: 'Failed to add expense record.' };
    }
}

export async function getExpenseRecords() {
    const session = await getSession();
    if (!session.schoolId || !(session.role === 'SchoolAdmin' || session.role === 'Finance' || session.role === 'SuperAdmin')) {
        return []; // Return empty array if unauthorized or no schoolId
    }

    try {
        const expenseRecords = await db.expenseRecord.findMany({
            where: { schoolId: session.schoolId },
            orderBy: { date: 'desc' },
        });
        return serialize(expenseRecords);
    } catch (error: any) {
        console.error('Get Expense Records Error:', error);
        return [];
    }
}

// Helper function to calculate fee breakdown for a student for a specific month
export async function calculateStudentFeeBreakdown(
    schoolId: string,
    studentId: string,
    month: string // e.g., "January"
) {
    const student = await db.student.findUnique({
        where: { id: studentId, schoolId: schoolId },
        select: {
            id: true,
            name: true,
            rollNumber: true,
            monthlyFees: true,
            discountPercentage: true,
            finalFee: true, // This is current final fee, not necessarily for a specific month
            class: {
                select: {
                    id: true,
                    name: true,
                    section: true,
                },
            },
        }
    });

    if (!student) {
        throw new Error('Student not found.');
    }

    const feeBreakdown: { description: string; amount: number }[] = [];
    let totalAmount = 0;

    // Base Monthly Fee
    const baseMonthlyFee = Number(student.monthlyFees);
    feeBreakdown.push({ description: `Monthly Tuition Fee (${month})`, amount: baseMonthlyFee });
    totalAmount += baseMonthlyFee;

    // Discount
    const discountPercentage = Number(student.discountPercentage);
    let discountAmount = 0;
    if (discountPercentage > 0) {
        discountAmount = baseMonthlyFee * (discountPercentage / 100);
        feeBreakdown.push({ description: `Discount (${discountPercentage}%)`, amount: -discountAmount });
        totalAmount -= discountAmount;
    }

    // Additional Charges applicable to this student for this month
    const additionalCharges = await db.additionalCharge.findMany({
        where: {
            schoolId: schoolId,
            AND: [
                {
                    OR: [
                        { studentId: student.id }, // Charges specific to this student
                        { classId: student.class?.id }, // Charges specific to this student's class
                        { studentId: null, classId: null }, // Global charges
                    ],
                },
                {
                    type: 'OneTime', // For now, only one-time charges apply to monthly challans
                    applicableMonths: { has: month }, // Check if charge applies to this month
                }
            ],
            // Ensure charge has not been applied to a challan for this student for this month already
            feeChallanItems: {
                none: {
                    feeChallan: {
                        studentId: student.id,
                        month: month,
                        status: { not: 'Cancelled' } // Don't count if already on a non-cancelled challan
                    }
                }
            }
        },
        select: {
            id: true,
            name: true,
            amount: true,
            type: true,
        }
    });

    for (const charge of additionalCharges) {
        feeBreakdown.push({ description: charge.name, amount: Number(charge.amount) });
        totalAmount += Number(charge.amount);
    }

    return serialize({
        student,
        feeBreakdown,
        baseMonthlyFee: baseMonthlyFee,
        discountAmount: discountAmount,
        totalAmount,
        linkedAdditionalCharges: additionalCharges.map(charge => ({
            id: charge.id,
            amount: Number(charge.amount),
        })),
    });
}

// --- Challan Generation ---

export async function generateChallan(studentId: string, month: string, year: number, dueDate: Date) {
    const session = await getSession();
    if (!session.schoolId || !(session.role === 'SchoolAdmin' || session.role === 'Finance' || session.role === 'SuperAdmin')) {
        return { success: false, message: 'Unauthorized' };
    }

    try {
        const { student, feeBreakdown, totalAmount, baseMonthlyFee, discountAmount, linkedAdditionalCharges } = await calculateStudentFeeBreakdown(
            session.schoolId,
            studentId,
            month
        );

        // Check if a challan for this student, month, and year already exists (and is not cancelled)
        const existingChallan = await db.feeChallan.findFirst({
            where: {
                studentId: studentId,
                month: month,
                year: year,
                schoolId: session.schoolId,
                status: { not: 'Cancelled' }
            }
        });

        if (existingChallan) {
            return { success: false, message: `Challan for ${student.name} for ${month} ${year} already exists.` };
        }

        const newChallan = await db.$transaction(async (tx) => {
            // Create FeeChallan
            const challan = await tx.feeChallan.create({
                data: {
                    schoolId: session.schoolId!,
                    studentId: studentId,
                    challanNumber: `CH-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`, // Auto-generate
                    month: month,
                    year: year,
                    issueDate: new Date(),
                    dueDate: dueDate,
                    amount: baseMonthlyFee, // Base monthly fee (before discount, excluding additional charges)
                    discount: discountAmount,
                    lateFeeAmount: 0, // Initially no late fees
                    totalAmount: totalAmount, // Total with additional charges and discount
                    paidAmount: 0,
                    status: 'Pending',
                    isGenerated: true,
                },
                include: {
                    student: {
                        include: {
                            class: true, // Include class details for student
                        },
                    },
                    feeBreakdown: true,
                    additionalCharges: {
                        include: {
                            additionalCharge: true, // Include details of the linked additional charge
                        },
                    },
                },
            });

            await createAuditLogEntry(
                session,
                'generate_challan',
                challan.id,
                'FeeChallan',
                `Generated new challan for student ${student.name} (${challan.challanNumber}) for ${month} ${year}.`,
                tx // Pass the transaction client
            );

            // Create FeeBreakdownItems
            for (const item of feeBreakdown) {
                await tx.feeBreakdownItem.create({
                    data: {
                        feeChallanId: challan.id,
                        description: item.description,
                        amount: item.amount,
                    }
                });
            }

            // Link additional charges
            for (const charge of linkedAdditionalCharges) {
                await tx.additionalChargeItem.create({
                    data: {
                        feeChallanId: challan.id,
                        additionalChargeId: charge.id,
                        amountApplied: charge.amount, // Use amount from the linked charge
                    }
                });
            }

            return challan;
        });

        revalidatePath('/school/finance/challans'); // New path for challans
        return { success: true, message: `Challan ${newChallan.challanNumber} generated successfully.`, challan: serialize(newChallan) };

    } catch (error: any) {
        console.error('Generate Challan Error:', error);
        return { success: false, message: error.message || 'Failed to generate challan.' };
    }
}

export async function generateBulkChallans(
    studentIds: string[],
    month: string,
    year: number,
    dueDate: Date
) {
    const session = await getSession();
    if (!session.schoolId || !(session.role === 'SchoolAdmin' || session.role === 'Finance' || session.role === 'SuperAdmin')) {
        return { success: false, message: 'Unauthorized' };
    }

    const results: { studentId: string; success: boolean; message: string; challan?: any }[] = [];
    const generatedChallans: any[] = [];

    for (const studentId of studentIds) {
        // Call the single challan generation function for each student
        const result = await generateChallan(studentId, month, year, dueDate);
        results.push({ studentId, success: result.success, message: result.message || '' });
        if (result.success && result.challan) {
            generatedChallans.push(result.challan);
        }
    }

    revalidatePath('/school/finance/challans');
    return { success: true, message: 'Bulk challan generation process completed.', results, generatedChallans };
}

export async function generateChallansByFilter(
    classId?: string,
    feeStatus?: string, // e.g., 'Pending', 'Overdue'
    month?: string,
    year?: number,
    dueDate?: Date
) {
    const session = await getSession();
    if (!session.schoolId || !(session.role === 'SchoolAdmin' || session.role === 'Finance' || session.role === 'SuperAdmin')) {
        return { success: false, message: 'Unauthorized' };
    }

    if (!month || !year || !dueDate) {
        return { success: false, message: 'Month, year, and due date are required for filtered generation.' };
    }

    const whereClause: any = {
        schoolId: session.schoolId,
        isActive: true,
    };

    if (classId) {
        whereClause.classId = classId;
    }

    // Note: Fee status filtering here is more complex as it depends on FeeChallan status, not student status directly.
    // For initial generation, we are looking for students to *create* challans for.
    // So, we might want to filter students who *don't* have a challan for the given month/year.

    const students = await db.student.findMany({
        where: whereClause,
        select: { id: true, name: true },
    });

    const studentIdsToGenerateFor: string[] = [];
    for (const student of students) {
        const existingChallan = await db.feeChallan.findFirst({
            where: {
                studentId: student.id,
                month: month,
                year: year,
                schoolId: session.schoolId,
                status: { not: 'Cancelled' }
            }
        });
        if (!existingChallan) {
            studentIdsToGenerateFor.push(student.id);
        }
    }

    if (studentIdsToGenerateFor.length === 0) {
        return { success: false, message: 'No students found to generate challans for based on the criteria.', generatedChallans: [] };
    }

    const results = await generateBulkChallans(studentIdsToGenerateFor, month, year, dueDate);
    return { ...results, generatedChallans: results.generatedChallans };
}

export async function updateChallanStatus(challanId: string, newStatus: string, paidAmount?: number, paidAt?: Date) {
    const session = await getSession();
    if (!session.schoolId || !(session.role === 'SchoolAdmin' || session.role === 'Finance' || session.role === 'SuperAdmin')) {
        return { success: false, message: 'Unauthorized' };
    }

    const statusEnum = newStatus as FeeStatus; // Cast to Prisma enum type

    try {
        const updatedChallan = await db.feeChallan.update({
            where: { id: challanId, schoolId: session.schoolId },
            data: {
                status: statusEnum,
                paidAmount: paidAmount !== undefined ? paidAmount : undefined,
                paidAt: paidAt !== undefined ? paidAt : undefined,
            },
            include: {
                student: true,
            }
        });

        // If challan is marked as Paid, create an IncomeRecord automatically
        if (updatedChallan.status === 'Paid') {
            await db.incomeRecord.create({
                data: {
                    schoolId: session.schoolId,
                    transactionId: `INC-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
                    description: `Fee Payment for ${updatedChallan.student.name} (${updatedChallan.month} ${updatedChallan.year}) - Challan ${updatedChallan.challanNumber}`,
                    amount: updatedChallan.paidAmount,
                    category: IncomeCategory.Fee, // Default category for student fees
                    source: 'Student Fees',
                    paymentMethod: 'Cash', // Default, can be updated later in UI
                    date: updatedChallan.paidAt || new Date(),
                    studentId: updatedChallan.studentId,
                    reference: updatedChallan.challanNumber,
                    isAutomatic: true,
                    feeChallans: {
                        connect: { id: updatedChallan.id }
                    }
                }
            });
        }

        revalidatePath('/school/finance/challans');
        return { success: true, message: `Challan ${updatedChallan.challanNumber} status updated to ${newStatus}.` };

    } catch (error: any) {
        console.error('Update Challan Status Error:', error);
        return { success: false, message: 'Failed to update challan status.' };
    }
}

// --- Additional Charges Management ---

const additionalChargeSchema = z.object({
    name: z.string().min(1, 'Charge name is required'),
    type: z.nativeEnum(ChargeType),
    amount: z.coerce.number().min(0.01, 'Amount must be positive'),
    applicableMonths: z.array(z.string()).optional(), // Array of month names
    incomeCategory: z.nativeEnum(IncomeCategory),
    studentId: z.string().optional().or(z.literal('')),
    classId: z.string().optional().or(z.literal('')),
});

export type AdditionalChargeState = {
    success?: boolean;
    message?: string;
    errors?: Record<string, string[]>;
};

export async function addAdditionalCharge(prevState: AdditionalChargeState | undefined, formData: FormData): Promise<AdditionalChargeState> {
    const session = await getSession();
    if (!session.schoolId || !(session.role === 'SchoolAdmin' || session.role === 'Finance' || session.role === 'SuperAdmin')) {
        return { message: 'Unauthorized' };
    }

    const rawData: any = Object.fromEntries(formData);
    // Ensure applicableMonths is an array, even if empty or single string
    const applicableMonths = formData.getAll('applicableMonths');
    if (applicableMonths.length === 0) {
        // If no months selected and it's a recurring charge, this is an issue.
        // For now, let's just ensure it's an array.
        rawData.applicableMonths = [];
    } else {
        rawData.applicableMonths = applicableMonths;
    }

    const result = additionalChargeSchema.safeParse(rawData);

    if (!result.success) {
        console.error("Validation Error:", result.error.flatten().fieldErrors);
        return {
            errors: result.error.flatten().fieldErrors,
            message: 'Validation failed.'
        };
    }

    const data = result.data;

    // Logic to ensure either studentId, classId, or neither (global) is set.
    // Cannot be both studentId and classId for a single charge definition.
    if (data.studentId && data.classId) {
        return { success: false, message: 'Additional charge cannot be applied to both a specific student and a specific class at the same time.' };
    }


    try {
        await db.additionalCharge.create({
            data: {
                schoolId: session.schoolId,
                name: data.name,
                type: data.type,
                amount: data.amount,
                applicableMonths: data.applicableMonths || [],
                incomeCategory: data.incomeCategory,
                studentId: data.studentId || null,
                classId: data.classId || null,
            }
        });

        revalidatePath('/school/finance/charges'); // New path for charges
        return { success: true, message: 'Additional charge added successfully.' };
    } catch (error: any) {
        console.error('Add Additional Charge Error:', error);
        return { success: false, message: 'Failed to add additional charge.' };
    }
}

export async function getAdditionalCharges() {
    const session = await getSession();
    if (!session.schoolId || !(session.role === 'SchoolAdmin' || session.role === 'Finance' || session.role === 'SuperAdmin')) {
        return []; // Return empty array if unauthorized or no schoolId
    }

    try {
        const additionalCharges = await db.additionalCharge.findMany({
            where: { schoolId: session.schoolId },
            include: {
                student: {
                    select: {
                        id: true,
                        name: true,
                        rollNumber: true,
                    },
                },
                class: {
                    select: {
                        id: true,
                        name: true,
                        section: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        return serialize(additionalCharges);
    } catch (error: any) {
        console.error('Get Additional Charges Error:', error);
        return [];
    }
}

// --- Salary Structure Management ---

const salaryStructureSchema = z.object({
    name: z.string().min(1, 'Structure name is required'),
    baseSalary: z.coerce.number().min(0, 'Base salary cannot be negative'),
    allowances: z.coerce.number().min(0, 'Allowances cannot be negative').optional().default(0),
    deductions: z.coerce.number().min(0, 'Deductions cannot be negative').optional().default(0),
});

export type SalaryStructureState = {
    success?: boolean;
    message?: string;
    errors?: Record<string, string[]>;
};

export async function addSalaryStructure(prevState: SalaryStructureState | undefined, formData: FormData): Promise<SalaryStructureState> {
    const session = await getSession();
    if (!session.schoolId || session.role !== 'SchoolAdmin') { // Only SchoolAdmin can manage salary structures
        return { message: 'Unauthorized' };
    }

    const result = salaryStructureSchema.safeParse(Object.fromEntries(formData));

    if (!result.success) {
        return {
            errors: result.error.flatten().fieldErrors,
            message: 'Validation failed.'
        };
    }

    const data = result.data;

    try {
        await db.salaryStructure.create({
            data: {
                schoolId: session.schoolId,
                name: data.name,
                baseSalary: data.baseSalary,
                allowances: data.allowances,
                deductions: data.deductions,
            }
        });

        revalidatePath('/school/finance/salary-structures'); // New path
        return { success: true, message: 'Salary structure added successfully.' };
    } catch (error: any) {
        console.error('Add Salary Structure Error:', error);
        if (error.code === 'P2002') {
            return { success: false, message: 'A salary structure with this name already exists.' };
        }
        return { success: false, message: 'Failed to add salary structure.' };
    }
}

export async function updateSalaryStructure(id: string, prevState: SalaryStructureState | undefined, formData: FormData): Promise<SalaryStructureState> {
    const session = await getSession();
    if (!session.schoolId || session.role !== 'SchoolAdmin') {
        return { message: 'Unauthorized' };
    }

    const result = salaryStructureSchema.safeParse(Object.fromEntries(formData));

    if (!result.success) {
        return {
            errors: result.error.flatten().fieldErrors,
            message: 'Validation failed.'
        };
    }

    const data = result.data;

    try {
        await db.salaryStructure.update({
            where: { id: id, schoolId: session.schoolId },
            data: {
                name: data.name,
                baseSalary: data.baseSalary,
                allowances: data.allowances,
                deductions: data.deductions,
            }
        });

        revalidatePath('/school/finance/salary-structures');
        return { success: true, message: 'Salary structure updated successfully.' };
    } catch (error: any) {
        console.error('Update Salary Structure Error:', error);
        if (error.code === 'P2002') {
            return { success: false, message: 'A salary structure with this name already exists.' };
        }
        return { success: false, message: 'Failed to update salary structure.' };
    }
}

export async function getSalaryStructures() {
    const session = await getSession();
    if (!session.schoolId || session.role !== 'SchoolAdmin') {
        return []; // Return empty array if unauthorized or no schoolId
    }

    try {
        const salaryStructures = await db.salaryStructure.findMany({
            where: { schoolId: session.schoolId },
            orderBy: { name: 'asc' },
        });
        return serialize(salaryStructures);
    } catch (error: any) {
        console.error('Get Salary Structures Error:', error);
        return [];
    }
}

export async function getSalaryStructureById(id: string) {
    const session = await getSession();
    if (!session.schoolId || session.role !== 'SchoolAdmin') {
        return null; // Return null if unauthorized or no schoolId
    }

    try {
        const salaryStructure = await db.salaryStructure.findUnique({
            where: { id: id, schoolId: session.schoolId },
        });
        return serialize(salaryStructure);
    } catch (error: any) {
        console.error('Get Salary Structure By Id Error:', error);
        return null;
    }
}

export async function assignSalaryStructure(
    employeeId: string,
    employeeType: EmployeeRole, // Use EmployeeRole enum
    salaryStructureId: string
) {
    const session = await getSession();
    if (!session.schoolId || session.role !== 'SchoolAdmin') {
        return { success: false, message: 'Unauthorized' };
    }

    try {
        if (employeeType === 'Teacher') {
            await db.teacher.update({
                where: { id: employeeId, schoolId: session.schoolId },
                data: { salaryStructureId: salaryStructureId }
            });
            revalidatePath('/school/teachers');
        } else if (employeeType === 'Staff') {
            await db.staff.update({
                where: { id: employeeId, schoolId: session.schoolId },
                data: { salaryStructureId: salaryStructureId }
            });
            revalidatePath('/school/staff'); // Assuming a staff page
        } else if (employeeType === 'Executive') {
            await db.executive.update({
                where: { id: employeeId, schoolId: session.schoolId },
                data: { salaryStructureId: salaryStructureId }
            });
            revalidatePath('/school/executives'); // Assuming an executives page
        } else {
            return { success: false, message: 'Invalid employee type.' };
        }

        return { success: true, message: 'Salary structure assigned successfully.' };
    } catch (error: any) {
        console.error('Assign Salary Structure Error:', error);
        return { success: false, message: 'Failed to assign salary structure.' };
    }
}

export async function generateSalarySlip(
    employeeId: string,
    employeeType: EmployeeRole,
    month: string,
    year: number,
    paidAt: Date
) {
    const session = await getSession();
    if (!session.schoolId || !(session.role === 'SchoolAdmin' || session.role === 'Finance' || session.role === 'SuperAdmin')) {
        return { success: false, message: 'Unauthorized' };
    }

    try {
        let employee: any;
        let salaryStructure: any;
        let employeeName: string;

        if (employeeType === 'Teacher') {
            employee = await db.teacher.findUnique({
                where: { id: employeeId, schoolId: session.schoolId },
                include: { salaryStructure: true }
            });
            employeeName = `${employee?.firstName} ${employee?.lastName}`;
        } else if (employeeType === 'Staff') {
            employee = await db.staff.findUnique({
                where: { id: employeeId, schoolId: session.schoolId },
                include: { salaryStructure: true }
            });
            employeeName = employee?.name;
        } else if (employeeType === 'Executive') {
            employee = await db.executive.findUnique({
                where: { id: employeeId, schoolId: session.schoolId },
                include: { salaryStructure: true }
            });
            employeeName = employee?.name;
        } else {
            return { success: false, message: 'Invalid employee type.' };
        }

        if (!employee) {
            return { success: false, message: 'Employee not found.' };
        }
        salaryStructure = employee.salaryStructure;

        if (!salaryStructure) {
            return { success: false, message: 'Employee does not have an assigned salary structure.' };
        }

        // Check for existing slip
        const existingSlip = await db.salarySlip.findFirst({
            where: {
                employeeType: employeeType,
                teacherId: employeeType === 'Teacher' ? employeeId : undefined,
                staffId: employeeType === 'Staff' ? employeeId : undefined,
                executiveId: employeeType === 'Executive' ? employeeId : undefined,
                month: month,
                year: year,
                schoolId: session.schoolId,
            }
        });

        if (existingSlip) {
            return { success: false, message: `Salary slip for ${employeeName} for ${month} ${year} already exists.` };
        }

        const netSalary = Number(salaryStructure.baseSalary) + Number(salaryStructure.allowances) - Number(salaryStructure.deductions);

        const newSlip = await db.$transaction(async (tx) => {
            const salarySlip = await tx.salarySlip.create({
                data: {
                    schoolId: session.schoolId!,
                    slipNumber: `SLP-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
                    month: month,
                    year: year,
                    baseSalary: salaryStructure.baseSalary,
                    allowances: salaryStructure.allowances,
                    deductions: salaryStructure.deductions,
                    bonuses: 0, // Manual bonuses can be added later
                    netSalary: netSalary,
                    paidAt: paidAt,
                    employeeType: employeeType,
                    teacherId: employeeType === 'Teacher' ? employeeId : null,
                    staffId: employeeType === 'Staff' ? employeeId : null,
                    executiveId: employeeType === 'Executive' ? employeeId : null,
                }
            });

            // Automatically create an Expense record
            await tx.expenseRecord.create({
                data: {
                    schoolId: session.schoolId!,
                    transactionId: `EXP-${Date.now()}-${Math.random().toString(36).substr(2, 2).toUpperCase()}`, // Shorter ID for expenses
                    description: `Salary payment for ${employeeName} (${month} ${year}) - Slip ${salarySlip.slipNumber}`,
                    amount: netSalary,
                    category: ExpenseCategory.Salary,
                    paidTo: employeeName,
                    paymentMethod: 'Bank Transfer', // Default, can be updated later in UI
                    date: paidAt,
                    isAutomatic: true,
                    salarySlips: {
                        connect: { id: salarySlip.id }
                    }
                }
            });
            return salarySlip;
        });

        revalidatePath('/school/finance/salary-slips'); // New path
        return { success: true, message: `Salary slip ${newSlip.slipNumber} generated successfully.` };

    } catch (error: any) {
        console.error('Generate Salary Slip Error:', error);
        return { success: false, message: error.message || 'Failed to generate salary slip.' };
    }
}

export async function generateBulkSalarySlips(
    employees: { employeeId: string; employeeType: EmployeeRole }[],
    month: string,
    year: number,
    paidAt: Date
) {
    const session = await getSession();
    if (!session.schoolId || !(session.role === 'SchoolAdmin' || session.role === 'Finance' || session.role === 'SuperAdmin')) {
        return { success: false, message: 'Unauthorized' };
    }

    const results: { employeeId: string; success: boolean; message: string }[] = [];

    for (const employee of employees) {
        const result = await generateSalarySlip(employee.employeeId, employee.employeeType, month, year, paidAt);
        results.push({ employeeId: employee.employeeId, success: result.success, message: result.message || '' });
    }

    revalidatePath('/school/finance/salary-slips');
    return { success: true, message: 'Bulk salary slip generation process completed.', results };
}

export async function getSalarySlips() {
    const session = await getSession();
    if (!session.schoolId || !(session.role === 'SchoolAdmin' || session.role === 'Finance' || session.role === 'SuperAdmin')) {
        return []; // Return empty array if unauthorized or no schoolId
    }

    try {
        const salarySlips = await db.salarySlip.findMany({
            where: { schoolId: session.schoolId },
            include: {
                teacher: { select: { firstName: true, lastName: true, id: true } },
                staff: { select: { name: true, id: true } },
                executive: { select: { name: true, id: true } },
                expenseRecord: { select: { transactionId: true } },
            },
            orderBy: { paidAt: 'desc' },
        });
        return serialize(salarySlips);
    } catch (error: any) {
        console.error('Get Salary Slips Error:', error);
        return [];
    }
}
export async function getTeachersForFinance() {
    const session = await getSession();
    if (!session.schoolId || !(session.role === 'SchoolAdmin' || session.role === 'Finance' || session.role === 'SuperAdmin')) {
        return [];
    }
    try {
        const teachers = await db.teacher.findMany({
            where: { schoolId: session.schoolId, isActive: true },
            include: { salaryStructure: true },
            orderBy: { firstName: 'asc' },
        });
        return serialize(teachers);
    } catch (error: any) {
        console.error('Get Teachers For Finance Error:', error);
        return [];
    }
}

export async function getStaffForFinance() {
    const session = await getSession();
    if (!session.schoolId || !(session.role === 'SchoolAdmin' || session.role === 'Finance' || session.role === 'SuperAdmin')) {
        return [];
    }
    try {
        const staff = await db.staff.findMany({
            where: { schoolId: session.schoolId, isActive: true },
            include: { salaryStructure: true },
            orderBy: { name: 'asc' },
        });
        return serialize(staff);
    } catch (error: any) {
        console.error('Get Staff For Finance Error:', error);
        return [];
    }
}

export async function getExecutivesForFinance() {
    const session = await getSession();
    if (!session.schoolId || !(session.role === 'SchoolAdmin' || session.role === 'Finance' || session.role === 'SuperAdmin')) {
        return [];
    }
    try {
        const executives = await db.executive.findMany({
            where: { schoolId: session.schoolId, isActive: true },
            include: { salaryStructure: true },
            orderBy: { name: 'asc' },
        });
        return serialize(executives);
    } catch (error: any) {
        console.error('Get Executives For Finance Error:', error);
        return [];
    }
}


