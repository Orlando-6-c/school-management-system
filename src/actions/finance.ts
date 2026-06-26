'use server';

import { getSession } from '@/lib/session';
import { hasPermission } from '@/lib/authz';
import db from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { IncomeCategory, ExpenseCategory, FeeStatus, ChargeType, EmployeeRole, Prisma } from '@prisma/client'; // Import enums and Prisma
import { createAuditLogEntry } from '@/lib/audit';
import { serializeData as serialize } from '@/lib/utils';

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
    if (!session.schoolId || !(await hasPermission('payments', 'create'))) {
        return { message: 'Access Denied: Insufficient Permissions' };
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
        const amountValue = parseFloat(data.amount.toString());
        if (isNaN(amountValue) || amountValue <= 0) {
            return { success: false, message: "Invalid amount. Must be a positive number." };
        }

        let dateValue = new Date(data.date);
        if (isNaN(dateValue.getTime())) {
            dateValue = new Date(); // Fallback to now
        }

        const newIncome = await db.incomeRecord.create({
            data: {
                schoolId: session.schoolId,
                transactionId: `INC-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`, // Auto-generate
                description: data.description,
                amount: amountValue, // Use parsed safe value
                category: data.category,
                source: data.source,
                paymentMethod: data.paymentMethod,
                date: dateValue, // Use parsed safe date
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

export async function deleteIncomeRecord(id: string) {
    const session = await getSession();
    if (!session.schoolId || !(await hasPermission('payments', 'delete'))) {
        return { success: false, message: 'Access Denied' };
    }
    try {
        const record = await db.incomeRecord.findUnique({ where: { id, schoolId: session.schoolId } });
        if (!record) return { success: false, message: 'Record not found' };
        if (record.isAutomatic) return { success: false, message: 'Auto-generated records cannot be deleted manually.' };
        await db.incomeRecord.delete({ where: { id, schoolId: session.schoolId } });
        revalidatePath('/school/finance');
        revalidatePath('/school/finance/income');
        return { success: true, message: 'Income record deleted.' };
    } catch (e: any) {
        return { success: false, message: 'Failed to delete record.' };
    }
}

export async function deleteExpenseRecord(id: string) {
    const session = await getSession();
    if (!session.schoolId || !(await hasPermission('expenses', 'delete'))) {
        return { success: false, message: 'Access Denied' };
    }
    try {
        const record = await db.expenseRecord.findUnique({ where: { id, schoolId: session.schoolId } });
        if (!record) return { success: false, message: 'Record not found' };
        if (record.isAutomatic) return { success: false, message: 'Auto-generated records cannot be deleted manually.' };
        await db.expenseRecord.delete({ where: { id, schoolId: session.schoolId } });
        revalidatePath('/school/finance');
        revalidatePath('/school/finance/expense');
        return { success: true, message: 'Expense record deleted.' };
    } catch (e: any) {
        return { success: false, message: 'Failed to delete record.' };
    }
}

export async function getChallans(filters?: { classId?: string; month?: string; year?: number; status?: string }) {
    const session = await getSession();
    if (!session.schoolId || !(await hasPermission('fees', 'view'))) return [];
    try {
        const where: any = { schoolId: session.schoolId };
        if (filters?.classId) where.student = { classId: filters.classId };
        if (filters?.month) where.month = filters.month;
        if (filters?.year) where.year = filters.year;
        if (filters?.status && filters.status !== 'all') where.status = filters.status;
        const challans = await db.feeChallan.findMany({
            where,
            include: {
                student: { select: { id: true, name: true, rollNumber: true, class: { select: { id: true, name: true, section: true } } } },
            },
            orderBy: [{ year: 'desc' }, { month: 'asc' }, { createdAt: 'desc' }],
        });
        return serialize(challans);
    } catch (e: any) {
        console.error('getChallans error:', e);
        return [];
    }
}

export async function getBulkChallans(params: {
    studentIds?: string[];
    classIds?: string[];
    month?: string;
    year?: number;
    status?: string;
}) {
    const session = await getSession();
    if (!session.schoolId || !(await hasPermission('fees', 'view'))) return [];
    try {
        const orClauses: any[] = [];
        if (params.studentIds?.length) orClauses.push({ studentId: { in: params.studentIds } });
        if (params.classIds?.length) orClauses.push({ student: { classId: { in: params.classIds } } });
        if (!orClauses.length) return [];

        const where: any = {
            schoolId: session.schoolId,
            OR: orClauses,
        };
        if (params.month) where.month = params.month;
        if (params.year) where.year = params.year;
        if (params.status && params.status !== 'all') where.status = params.status;

        const challans = await db.feeChallan.findMany({
            where,
            include: {
                student: {
                    include: {
                        class: { select: { name: true, section: true } },
                        guardian: { select: { name: true } },
                    },
                },
                feeBreakdown: { orderBy: { id: 'asc' } },
            },
            orderBy: [{ student: { class: { name: 'asc' } } }, { student: { name: 'asc' } }],
        });
        return serialize(challans.map(c => ({
            ...c,
            totalAmount: Number(c.totalAmount),
            paidAmount: Number(c.paidAmount),
            feeBreakdown: c.feeBreakdown.map(i => ({ ...i, amount: Number(i.amount) })),
        })));
    } catch (e: any) {
        console.error('getBulkChallans error:', e);
        return [];
    }
}

export async function markChallanPaid(challanId: string, paidAmount: number, paymentMethod: string, paidAt: Date) {
    const session = await getSession();
    if (!session.schoolId || !(await hasPermission('fees', 'edit'))) {
        return { success: false, message: 'Access Denied' };
    }
    try {
        const challan = await db.feeChallan.findUnique({
            where: { id: challanId, schoolId: session.schoolId },
            include: { student: true },
        });
        if (!challan) return { success: false, message: 'Challan not found.' };
        if (challan.status === 'Paid') return { success: false, message: 'Challan is already fully paid.' };

        const totalAmount = Number(challan.totalAmount);
        const alreadyPaid = Number(challan.paidAmount);
        const newTotalPaid = alreadyPaid + paidAmount;
        const isFullyPaid = newTotalPaid >= totalAmount;

        await db.$transaction(async (tx) => {
            await tx.feeChallan.update({
                where: { id: challanId },
                data: {
                    status: isFullyPaid ? 'Paid' : 'Pending',
                    paidAmount: newTotalPaid,
                    paidAt: isFullyPaid ? paidAt : null,
                },
            });
            await tx.incomeRecord.create({
                data: {
                    schoolId: session.schoolId!,
                    transactionId: `INC-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
                    description: `Fee payment — ${challan.student.name} (${challan.month} ${challan.year}) Challan ${challan.challanNumber}${!isFullyPaid ? ` [partial: Rs ${paidAmount}]` : ''}`,
                    amount: paidAmount,
                    category: IncomeCategory.Fee,
                    source: 'Student Fees',
                    paymentMethod,
                    date: paidAt,
                    studentId: challan.studentId,
                    reference: challan.challanNumber,
                    isAutomatic: true,
                    feeChallans: { connect: { id: challanId } },
                },
            });
        });
        revalidatePath('/school/finance/challan');
        revalidatePath('/school/finance');
        return {
            success: true,
            isFullyPaid,
            challanId,
            challanNumber: challan.challanNumber,
            message: isFullyPaid
                ? `Challan ${challan.challanNumber} fully paid.`
                : `Partial payment of Rs ${paidAmount} recorded. Remaining: Rs ${(totalAmount - newTotalPaid).toFixed(0)}.`,
        };
    } catch (e: any) {
        console.error('markChallanPaid error:', e);
        return { success: false, message: 'Failed to mark challan as paid.' };
    }
}

export async function cancelChallan(challanId: string) {
    const session = await getSession();
    if (!session.schoolId || !(await hasPermission('fees', 'edit'))) {
        return { success: false, message: 'Access Denied' };
    }
    try {
        await db.feeChallan.update({
            where: { id: challanId, schoolId: session.schoolId },
            data: { status: 'Cancelled' },
        });
        revalidatePath('/school/finance/challan');
        return { success: true, message: 'Challan cancelled.' };
    } catch (e: any) {
        return { success: false, message: 'Failed to cancel challan.' };
    }
}

export async function getChallanForEdit(challanId: string) {
    const session = await getSession();
    if (!session.schoolId || !(await hasPermission('fees', 'view'))) return null;
    try {
        const challan = await db.feeChallan.findUnique({
            where: { id: challanId, schoolId: session.schoolId },
            include: {
                student: {
                    select: {
                        name: true, rollNumber: true,
                        class: { select: { name: true, section: true } },
                    },
                },
                feeBreakdown: { orderBy: { id: 'asc' } },
            },
        });
        if (!challan) return null;
        return serialize({
            ...challan,
            amount: Number(challan.amount),
            totalAmount: Number(challan.totalAmount),
            discount: Number(challan.discount),
            paidAmount: Number(challan.paidAmount),
            feeBreakdown: challan.feeBreakdown.map(i => ({ ...i, amount: Number(i.amount) })),
        });
    } catch {
        return null;
    }
}

export async function addChallanLineItem(challanId: string, description: string, amount: number) {
    const session = await getSession();
    if (!session.schoolId || !(await hasPermission('fees', 'edit'))) {
        return { success: false, message: 'Access Denied' };
    }
    if (!description.trim() || amount <= 0) {
        return { success: false, message: 'Description and a positive amount are required.' };
    }
    try {
        const challan = await db.feeChallan.findUnique({
            where: { id: challanId, schoolId: session.schoolId },
            select: { status: true, totalAmount: true },
        });
        if (!challan) return { success: false, message: 'Challan not found.' };
        if (challan.status === 'Paid' || challan.status === 'Cancelled') {
            return { success: false, message: 'Cannot edit a Paid or Cancelled challan.' };
        }
        const item = await db.$transaction(async (tx) => {
            const newItem = await tx.feeBreakdownItem.create({
                data: { feeChallanId: challanId, description: description.trim(), amount },
            });
            await tx.feeChallan.update({
                where: { id: challanId },
                data: { totalAmount: { increment: amount } },
            });
            return newItem;
        });
        revalidatePath(`/school/finance/challan/${challanId}/edit`);
        revalidatePath('/school/finance/challan');
        return { success: true, item: serialize({ ...item, amount: Number(item.amount) }) };
    } catch (e: any) {
        return { success: false, message: 'Failed to add line item.' };
    }
}

export async function removeChallanLineItem(challanId: string, itemId: string) {
    const session = await getSession();
    if (!session.schoolId || !(await hasPermission('fees', 'edit'))) {
        return { success: false, message: 'Access Denied' };
    }
    try {
        const challan = await db.feeChallan.findUnique({
            where: { id: challanId, schoolId: session.schoolId },
            select: { status: true },
        });
        if (!challan) return { success: false, message: 'Challan not found.' };
        if (challan.status === 'Paid' || challan.status === 'Cancelled') {
            return { success: false, message: 'Cannot edit a Paid or Cancelled challan.' };
        }
        const item = await db.feeBreakdownItem.findUnique({ where: { id: itemId } });
        if (!item || item.feeChallanId !== challanId) return { success: false, message: 'Item not found.' };

        await db.$transaction(async (tx) => {
            await tx.feeBreakdownItem.delete({ where: { id: itemId } });
            await tx.feeChallan.update({
                where: { id: challanId },
                data: { totalAmount: { decrement: Number(item.amount) } },
            });
        });
        revalidatePath(`/school/finance/challan/${challanId}/edit`);
        revalidatePath('/school/finance/challan');
        return { success: true };
    } catch (e: any) {
        return { success: false, message: 'Failed to remove line item.' };
    }
}

export async function updateChallanDetails(challanId: string, dueDate: Date, remarks: string) {
    const session = await getSession();
    if (!session.schoolId || !(await hasPermission('fees', 'edit'))) {
        return { success: false, message: 'Access Denied' };
    }
    try {
        const challan = await db.feeChallan.findUnique({
            where: { id: challanId, schoolId: session.schoolId },
            select: { status: true },
        });
        if (!challan) return { success: false, message: 'Challan not found.' };
        if (challan.status === 'Paid' || challan.status === 'Cancelled') {
            return { success: false, message: 'Cannot edit a Paid or Cancelled challan.' };
        }
        await db.feeChallan.update({
            where: { id: challanId },
            data: { dueDate, remarks: remarks.trim() || null },
        });
        revalidatePath(`/school/finance/challan/${challanId}/edit`);
        revalidatePath('/school/finance/challan');
        return { success: true };
    } catch (e: any) {
        return { success: false, message: 'Failed to update challan.' };
    }
}

export async function getIncomeRecords() {
    const session = await getSession();
    if (!session.schoolId || !(await hasPermission('payments', 'view'))) {
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

        // Safe Filtering: Remove broken records or fix them on the fly
        const safeRecords = incomeRecords.map(record => {
            // Ensure amount is a number
            const amt = Number(record.amount);
            return {
                ...record,
                amount: isNaN(amt) ? 0 : amt, // Fix NaN amount
                // Ensure date is valid string or Date object
            };
        });

        return serialize(safeRecords);
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
    if (!session.schoolId || !(await hasPermission('expenses', 'create'))) {
        return { message: 'Access Denied: Insufficient Permissions' };
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
        const amountValue = parseFloat(data.amount.toString());
        if (isNaN(amountValue) || amountValue <= 0) {
            return { success: false, message: "Invalid amount. Must be a positive number." };
        }

        let dateValue = new Date(data.date);
        if (isNaN(dateValue.getTime())) {
            dateValue = new Date(); // Fallback to now
        }

        const newExpense = await db.expenseRecord.create({
            data: {
                schoolId: session.schoolId,
                transactionId: `EXP-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`, // Auto-generate
                description: data.description,
                amount: amountValue, // Use parsed safe value
                category: data.category,
                paidTo: data.paidTo,
                paymentMethod: data.paymentMethod,
                date: dateValue, // Use parsed safe date
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
    if (!session.schoolId || !(await hasPermission('expenses', 'view'))) {
        return []; // Return empty array if unauthorized or no schoolId
    }

    try {
        const expenseRecords = await db.expenseRecord.findMany({
            where: { schoolId: session.schoolId },
            orderBy: { date: 'desc' },
        });

        // Safe Filtering
        const safeRecords = expenseRecords.map(record => {
            const amt = Number(record.amount);
            return {
                ...record,
                amount: isNaN(amt) ? 0 : amt,
            };
        });

        return serialize(safeRecords);
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
            guardian: {
                select: { students: { select: { id: true } } }
            }
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
    let discountPercentage = Number(student.discountPercentage);

    // Automatically apply minimum 20% sibling discount if guardian has >1 student (SRS 3.2.4)
    const isSibling = student.guardian?.students && student.guardian.students.length > 1;
    if (isSibling && discountPercentage < 20) {
        discountPercentage = 20;
    }

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
                        { studentIds: { has: student.id } },
                        ...(student.class?.id ? [{ classIds: { has: student.class.id } }] : []),
                        { studentIds: { isEmpty: true }, classIds: { isEmpty: true } }, // Global charges
                    ],
                },
                {
                    applicableMonths: { has: month },
                }
            ],
            feeChallanItems: {
                none: {
                    feeChallan: {
                        studentId: student.id,
                        month: month,
                        status: { not: 'Cancelled' }
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
    if (!session.schoolId || !(await hasPermission('fees', 'create'))) {
        return { success: false, message: 'Access Denied: Insufficient Permissions' };
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
            // Generate PSID: mathematically derived checksum
            const yearSlice = year.toString().slice(-2);
            const monthSlice = month.substring(0, 3).toUpperCase();
            const cryptoMath = Math.floor(Math.random() * 89999 + 10000);
            const baseHash = (Date.now() % 1000).toString() + cryptoMath.toString();
            const generatedPSID = `PSID-${yearSlice}${monthSlice}-${baseHash}`;

            // Create FeeChallan
            const challan = await tx.feeChallan.create({
                data: {
                    schoolId: session.schoolId!,
                    studentId: studentId,
                    challanNumber: generatedPSID,
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
    if (!session.schoolId || !(await hasPermission('fees', 'create'))) {
        return { success: false, message: 'Access Denied: Insufficient Permissions' };
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
    if (!session.schoolId || !(await hasPermission('fees', 'create'))) {
        return { success: false, message: 'Access Denied: Insufficient Permissions' };
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
    if (!session.schoolId || !(await hasPermission('fees', 'edit'))) {
        return { success: false, message: 'Access Denied: Insufficient Permissions' };
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
    applicableMonths: z.array(z.string()).optional(),
    incomeCategory: z.nativeEnum(IncomeCategory),
    studentIds: z.array(z.string()).optional(),
    classIds: z.array(z.string()).optional(),
});

export type AdditionalChargeState = {
    success?: boolean;
    message?: string;
    errors?: Record<string, string[]>;
};

export async function addAdditionalCharge(prevState: AdditionalChargeState | undefined, formData: FormData): Promise<AdditionalChargeState> {
    const session = await getSession();
    if (!session.schoolId || !(await hasPermission('fees', 'create'))) {
        return { message: 'Access Denied: Insufficient Permissions' };
    }

    const rawData: any = Object.fromEntries(formData);
    rawData.applicableMonths = formData.getAll('applicableMonths');
    rawData.studentIds = formData.getAll('studentIds');
    rawData.classIds = formData.getAll('classIds');

    const result = additionalChargeSchema.safeParse(rawData);
    if (!result.success) {
        return { errors: result.error.flatten().fieldErrors, message: 'Validation failed.' };
    }

    const data = result.data;
    try {
        await db.additionalCharge.create({
            data: {
                schoolId: session.schoolId,
                name: data.name,
                type: data.type,
                amount: data.amount,
                applicableMonths: data.applicableMonths || [],
                incomeCategory: data.incomeCategory,
                studentIds: data.studentIds || [],
                classIds: data.classIds || [],
            }
        });
        revalidatePath('/school/finance/charges');
        return { success: true, message: 'Additional charge added successfully.' };
    } catch (error: any) {
        console.error('Add Additional Charge Error:', error);
        return { success: false, message: 'Failed to add additional charge.' };
    }
}

export async function deleteAdditionalCharge(id: string) {
    const session = await getSession();
    if (!session.schoolId || !(await hasPermission('fees', 'delete'))) {
        return { success: false, message: 'Access Denied' };
    }
    try {
        const inUse = await db.additionalChargeItem.count({ where: { additionalChargeId: id } });
        if (inUse > 0) {
            return { success: false, message: 'This charge is already linked to one or more challans and cannot be deleted.' };
        }
        await db.additionalCharge.delete({ where: { id, schoolId: session.schoolId } });
        revalidatePath('/school/finance/charges');
        return { success: true };
    } catch (e: any) {
        return { success: false, message: 'Failed to delete additional charge.' };
    }
}

export async function getAdditionalCharges() {
    const session = await getSession();
    if (!session.schoolId || !(await hasPermission('fees', 'view'))) {
        return []; // Return empty array if unauthorized or no schoolId
    }

    try {
        const charges = await db.additionalCharge.findMany({
            where: { schoolId: session.schoolId },
            orderBy: { createdAt: 'desc' },
        });

        // Batch-resolve student/class names from the ID arrays
        const allStudentIds = [...new Set(charges.flatMap(c => c.studentIds))];
        const allClassIds = [...new Set(charges.flatMap(c => c.classIds))];
        const [students, classes] = await Promise.all([
            allStudentIds.length > 0
                ? db.student.findMany({ where: { id: { in: allStudentIds } }, select: { id: true, name: true, rollNumber: true } })
                : [],
            allClassIds.length > 0
                ? db.class.findMany({ where: { id: { in: allClassIds } }, select: { id: true, name: true, section: true } })
                : [],
        ]);
        const studentMap = Object.fromEntries(students.map(s => [s.id, s]));
        const classMap = Object.fromEntries(classes.map(c => [c.id, c]));

        const enriched = charges.map(c => ({
            ...c,
            amount: Number(c.amount),
            resolvedStudents: c.studentIds.map(id => studentMap[id]).filter(Boolean),
            resolvedClasses: c.classIds.map(id => classMap[id]).filter(Boolean),
        }));
        return serialize(enriched);
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
    if (!session.schoolId || !(await hasPermission('salaries', 'create'))) {
        return { message: 'Access Denied: Insufficient Permissions' };
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
    if (!session.schoolId || !(await hasPermission('salaries', 'edit'))) {
        return { message: 'Access Denied: Insufficient Permissions' };
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
    if (!session.schoolId || !(await hasPermission('salaries', 'view'))) {
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
    if (!session.schoolId || !(await hasPermission('salaries', 'view'))) {
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
    if (!session.schoolId || !(await hasPermission('salaries', 'edit'))) {
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
    if (!session.schoolId || !(await hasPermission('salaries', 'create'))) {
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
    if (!session.schoolId || !(await hasPermission('salaries', 'create'))) {
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

export async function getSalarySlips(month?: string, year?: number) {
    const session = await getSession();
    if (!session.schoolId || !(await hasPermission('salaries', 'view'))) return [];
    try {
        const where: any = { schoolId: session.schoolId };
        if (month) where.month = month;
        if (year) where.year = year;
        const salarySlips = await db.salarySlip.findMany({
            where,
            include: {
                teacher: { select: { firstName: true, lastName: true, id: true } },
                staff: { select: { name: true, id: true } },
                executive: { select: { name: true, id: true } },
                expenseRecord: { select: { transactionId: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        return serialize(salarySlips);
    } catch (error: any) {
        console.error('Get Salary Slips Error:', error);
        return [];
    }
}

export async function generateMonthlySalarySlips(month: string, year: number) {
    const session = await getSession();
    if (!session.schoolId || !(await hasPermission('salaries', 'create'))) {
        return { success: false, message: 'Access Denied' };
    }
    try {
        const [teachers, staff] = await Promise.all([
            db.teacher.findMany({ where: { schoolId: session.schoolId, isActive: true } }),
            db.staff.findMany({ where: { schoolId: session.schoolId, isActive: true } }),
        ]);

        const slips: any[] = [];
        let skipped = 0;

        const processEmployee = async (emp: any, type: EmployeeRole, empId: string, nameKey: string) => {
            const base = Number(emp.salary ?? 0);
            if (base <= 0) return; // skip employees with no salary set

            const existing = await db.salarySlip.findFirst({
                where: { schoolId: session.schoolId!, month, year, employeeType: type, ...(type === 'Teacher' ? { teacherId: empId } : { staffId: empId }) },
            });
            if (existing) { skipped++; return; }

            const extras: { name: string; amount: number }[] = Array.isArray(emp.salaryExtras) ? emp.salaryExtras : [];
            const allowances = extras.filter(e => e.amount > 0).reduce((s, e) => s + e.amount, 0);
            const deductions = extras.filter(e => e.amount < 0).reduce((s, e) => s + Math.abs(e.amount), 0);
            const netSalary = base + allowances - deductions;

            const slipNumber = `SAL-${year}-${month.substring(0, 3).toUpperCase()}-${type.substring(0, 1)}-${Date.now().toString(36).toUpperCase()}`;

            slips.push({
                schoolId: session.schoolId!,
                slipNumber,
                month,
                year,
                baseSalary: base,
                allowances,
                deductions,
                bonuses: 0,
                netSalary,
                status: 'Pending',
                employeeType: type,
                ...(type === 'Teacher' ? { teacherId: empId } : { staffId: empId }),
                remarks: extras.length ? extras.map(e => `${e.name}: Rs ${e.amount}`).join(', ') : null,
            });
        };

        for (const t of teachers) await processEmployee(t, 'Teacher', t.id, 'teacher');
        for (const s of staff) await processEmployee(s, 'Staff', s.id, 'staff');

        if (!slips.length) {
            return { success: false, message: skipped > 0 ? `All slips already exist for ${month} ${year}.` : 'No employees with a salary set.' };
        }

        await db.salarySlip.createMany({ data: slips });
        revalidatePath('/school/finance/salary-slips');
        return { success: true, message: `Generated ${slips.length} salary slip(s) for ${month} ${year}. ${skipped > 0 ? `${skipped} already existed.` : ''}` };
    } catch (e: any) {
        console.error('generateMonthlySalarySlips error:', e);
        return { success: false, message: 'Failed to generate salary slips.' };
    }
}

export async function markSalarySlipPaid(slipId: string, paidAt: Date) {
    const session = await getSession();
    if (!session.schoolId || !(await hasPermission('salaries', 'edit'))) {
        return { success: false, message: 'Access Denied' };
    }
    try {
        const slip = await db.salarySlip.findUnique({
            where: { id: slipId, schoolId: session.schoolId },
            include: {
                teacher: { select: { firstName: true, lastName: true } },
                staff: { select: { name: true } },
            },
        });
        if (!slip) return { success: false, message: 'Salary slip not found.' };
        if (slip.status === 'Paid') return { success: false, message: 'Already marked as paid.' };

        const employeeName = slip.teacher
            ? `${slip.teacher.firstName} ${slip.teacher.lastName}`
            : slip.staff?.name ?? 'Unknown';

        await db.$transaction(async (tx) => {
            const expense = await tx.expenseRecord.create({
                data: {
                    schoolId: session.schoolId!,
                    transactionId: `EXP-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
                    description: `Salary — ${employeeName} (${slip.month} ${slip.year})`,
                    amount: Number(slip.netSalary),
                    category: ExpenseCategory.Salary,
                    paidTo: employeeName,
                    paymentMethod: 'Bank Transfer',
                    date: paidAt,
                    reference: slip.slipNumber,
                    isAutomatic: true,
                },
            });
            await tx.salarySlip.update({
                where: { id: slipId },
                data: { status: 'Paid', paidAt, expenseRecordId: expense.id },
            });
        });

        revalidatePath('/school/finance/salary-slips');
        revalidatePath('/school/finance');
        return { success: true, message: `Salary paid for ${employeeName} — ${slip.month} ${slip.year}.` };
    } catch (e: any) {
        console.error('markSalarySlipPaid error:', e);
        return { success: false, message: 'Failed to mark salary as paid.' };
    }
}
export async function getTeachersForFinance() {
    const session = await getSession();
    if (!session.schoolId || !(await hasPermission('salaries', 'view'))) {
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
    if (!session.schoolId || !(await hasPermission('salaries', 'view'))) {
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
    if (!session.schoolId || !(await hasPermission('salaries', 'view'))) {
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


