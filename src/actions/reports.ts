'use server';

import { getSession } from '@/lib/session';
import { hasPermission } from '@/lib/authz';
import db from '@/lib/db';

// ── Fee Collection Summary ───────────────────────────────────────────────────

export async function getFeeCollectionReport(month: number, year: number) {
    const session = await getSession();
    if (!session.schoolId || !(await hasPermission('reports', 'view'))) {
        return { success: false as const, message: 'Access denied' };
    }

    const challans = await db.feeChallan.findMany({
        where: { schoolId: session.schoolId, month: String(month).padStart(2, '0'), year },
        include: { student: { select: { name: true, rollNumber: true, class: { select: { name: true, section: true } } } } },
        orderBy: { createdAt: 'desc' },
    });

    const summary = {
        total: challans.length,
        paid: challans.filter((c) => c.status === 'Paid').length,
        pending: challans.filter((c) => c.status === 'Pending').length,
        overdue: challans.filter((c) => c.status === 'Overdue').length,
        partiallyPaid: challans.filter((c) => c.status === 'PartiallyPaid').length,
        totalAmount: challans.reduce((s, c) => s + Number(c.totalAmount), 0),
        collectedAmount: challans.filter((c) => c.status === 'Paid').reduce((s, c) => s + Number(c.totalAmount), 0),
    };

    const rows = challans.map((c) => ({
        id: c.id,
        challanNumber: c.challanNumber,
        studentName: c.student.name,
        rollNumber: c.student.rollNumber,
        className: `${c.student.class?.name ?? ''}${c.student.class?.section ? ` (${c.student.class.section})` : ''}`,
        amount: Number(c.totalAmount),
        paidAmount: Number(c.paidAmount),
        status: c.status,
        dueDate: c.dueDate.toISOString().split('T')[0],
    }));

    return { success: true as const, summary, rows };
}

// ── Defaulters ───────────────────────────────────────────────────────────────

export async function getDefaultersReport(classId?: string) {
    const session = await getSession();
    if (!session.schoolId || !(await hasPermission('reports', 'view'))) {
        return { success: false as const, message: 'Access denied' };
    }

    const now = new Date();

    const challans = await db.feeChallan.findMany({
        where: {
            schoolId: session.schoolId,
            status: { in: ['Pending', 'Overdue', 'PartiallyPaid'] },
            dueDate: { lt: now },
            ...(classId ? { student: { classId } } : {}),
        },
        include: {
            student: { select: { id: true, name: true, rollNumber: true, class: { select: { name: true, section: true } } } },
        },
        orderBy: { dueDate: 'asc' },
    });

    const rows = challans.map((c) => ({
        challanId: c.id,
        challanNumber: c.challanNumber,
        studentId: c.student.id,
        studentName: c.student.name,
        rollNumber: c.student.rollNumber,
        className: `${c.student.class?.name ?? ''}${c.student.class?.section ? ` (${c.student.class.section})` : ''}`,
        amount: Number(c.totalAmount),
        paidAmount: Number(c.paidAmount),
        balance: Number(c.totalAmount) - Number(c.paidAmount),
        status: c.status,
        dueDate: c.dueDate.toISOString().split('T')[0],
        daysOverdue: Math.floor((now.getTime() - c.dueDate.getTime()) / 86400000),
    }));

    const totalBalance = rows.reduce((s, r) => s + r.balance, 0);

    return { success: true as const, rows, totalBalance };
}

// ── Income vs Expense ────────────────────────────────────────────────────────

export async function getIncomeExpenseReport(year: number) {
    const session = await getSession();
    if (!session.schoolId || !(await hasPermission('reports', 'view'))) {
        return { success: false as const, message: 'Access denied' };
    }

    const from = new Date(year, 0, 1);
    const to = new Date(year + 1, 0, 1);

    const [incomeRecords, expenseRecords] = await Promise.all([
        db.incomeRecord.findMany({
            where: { schoolId: session.schoolId, date: { gte: from, lt: to } },
            select: { amount: true, category: true, date: true },
        }),
        db.expenseRecord.findMany({
            where: { schoolId: session.schoolId, date: { gte: from, lt: to } },
            select: { amount: true, category: true, date: true },
        }),
    ]);

    const months = Array.from({ length: 12 }, (_, i) => {
        const label = new Date(year, i, 1).toLocaleString('default', { month: 'short' });
        const income = incomeRecords.filter((r) => r.date.getMonth() === i).reduce((s, r) => s + Number(r.amount), 0);
        const expense = expenseRecords.filter((r) => r.date.getMonth() === i).reduce((s, r) => s + Number(r.amount), 0);
        return { month: label, income, expense, net: income - expense };
    });

    const totalIncome = months.reduce((s, m) => s + m.income, 0);
    const totalExpense = months.reduce((s, m) => s + m.expense, 0);

    // Category breakdown
    const incomeByCategory: Record<string, number> = {};
    for (const r of incomeRecords) {
        incomeByCategory[r.category] = (incomeByCategory[r.category] ?? 0) + Number(r.amount);
    }
    const expenseByCategory: Record<string, number> = {};
    for (const r of expenseRecords) {
        expenseByCategory[r.category] = (expenseByCategory[r.category] ?? 0) + Number(r.amount);
    }

    return { success: true as const, months, totalIncome, totalExpense, incomeByCategory, expenseByCategory };
}

// ── Salary Register ──────────────────────────────────────────────────────────

export async function getSalaryRegisterReport(month: string, year: number) {
    const session = await getSession();
    if (!session.schoolId || !(await hasPermission('reports', 'view'))) {
        return { success: false as const, message: 'Access denied' };
    }

    const slips = await db.salarySlip.findMany({
        where: { schoolId: session.schoolId, month, year },
        include: {
            teacher: { select: { firstName: true, lastName: true, subject: true } },
            staff: { select: { name: true, role: true } },
            executive: { select: { name: true, designation: true } },
        },
        orderBy: { createdAt: 'asc' },
    });

    const rows = slips.map((s) => {
        const name = s.teacher
            ? `${s.teacher.firstName} ${s.teacher.lastName}`
            : s.staff?.name ?? s.executive?.name ?? 'Unknown';
        const role = s.teacher
            ? `Teacher — ${s.teacher.subject}`
            : s.staff?.role ?? s.executive?.designation ?? '';
        return {
            id: s.id,
            name,
            role,
            employeeType: s.employeeType,
            baseSalary: Number(s.baseSalary),
            allowances: Number(s.allowances),
            deductions: Number(s.deductions),
            netSalary: Number(s.netSalary),
            paidAt: s.paidAt ? s.paidAt.toISOString().split('T')[0] : null,
        };
    });

    const totalNet = rows.reduce((s, r) => s + r.netSalary, 0);

    return { success: true as const, rows, totalNet };
}
