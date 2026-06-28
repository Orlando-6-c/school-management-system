import { NextRequest } from 'next/server';
import { getSession } from '@/lib/session';
import { hasPermission } from '@/lib/authz';
import db from '@/lib/db';

export const runtime = 'nodejs';

function esc(v: string | number | null | undefined): string {
    return `"${String(v ?? '').replace(/"/g, '""')}"`;
}

function toCSV(headers: string[], rows: (string | number | null | undefined)[][]): string {
    return [headers, ...rows].map((r) => r.map(esc).join(',')).join('\r\n');
}

export async function GET(req: NextRequest) {
    const session = await getSession();
    if (!session.schoolId) return new Response('Unauthorized', { status: 401 });
    if (!(await hasPermission('reports', 'view'))) return new Response('Forbidden', { status: 403 });

    const type = req.nextUrl.searchParams.get('type');

    if (type === 'students') {
        const students = await db.student.findMany({
            where: { schoolId: session.schoolId, isActive: true },
            include: { class: true, guardian: true },
            orderBy: [{ class: { gradeLevel: 'asc' } }, { rollNumber: 'asc' }],
        });
        const csv = toCSV(
            ['Roll Number', 'Name', 'Gender', 'Date of Birth', 'Date of Admission', 'B-Form', 'Class', 'Section', 'Monthly Fee', 'Discount %', 'Final Fee', 'Guardian Name', 'Guardian CNIC', 'Guardian Contact', 'Guardian Relation'],
            students.map((s) => [
                s.rollNumber, s.name, s.gender, s.dateOfBirth.toISOString().slice(0, 10),
                s.dateOfAdmission.toISOString().slice(0, 10), s.bFormNumber,
                s.class.name, s.class.section ?? '', Number(s.monthlyFees), Number(s.discountPercentage), Number(s.finalFee),
                s.guardian.name, s.guardian.cnic, s.guardian.contact, s.guardian.relation,
            ]),
        );
        return new Response(csv, {
            headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="students.csv"' },
        });
    }

    if (type === 'teachers') {
        const teachers = await db.teacher.findMany({
            where: { schoolId: session.schoolId, isActive: true },
            orderBy: { firstName: 'asc' },
        });
        const csv = toCSV(
            ['First Name', 'Last Name', 'Email', 'Phone', 'Gender', 'CNIC', 'Qualification', 'Subject', 'Experience', 'Joining Date', 'Salary'],
            teachers.map((t) => [
                t.firstName, t.lastName, t.email, t.phone, t.gender, t.cnic,
                t.qualification, t.subject, t.experience ?? '', t.joiningDate.toISOString().slice(0, 10), t.salary ?? 0,
            ]),
        );
        return new Response(csv, {
            headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="teachers.csv"' },
        });
    }

    if (type === 'fees') {
        const challans = await db.feeChallan.findMany({
            where: { schoolId: session.schoolId },
            include: { student: { select: { name: true, rollNumber: true, class: { select: { name: true } } } } },
            orderBy: { dueDate: 'desc' },
        });
        const csv = toCSV(
            ['Challan #', 'Student', 'Roll Number', 'Class', 'Month', 'Total Amount', 'Paid Amount', 'Status', 'Due Date', 'Paid At'],
            challans.map((c) => [
                c.challanNumber, c.student.name, c.student.rollNumber, c.student.class.name,
                c.month, Number(c.totalAmount), Number(c.paidAmount), c.status,
                c.dueDate.toISOString().slice(0, 10), c.paidAt?.toISOString().slice(0, 10) ?? '',
            ]),
        );
        return new Response(csv, {
            headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="fee-challans.csv"' },
        });
    }

    if (type === 'staff') {
        const staff = await db.staff.findMany({
            where: { schoolId: session.schoolId, isActive: true },
            orderBy: { name: 'asc' },
        });
        const csv = toCSV(
            ['Name', 'Father Name', 'CNIC', 'Contact', 'Gender', 'Role', 'Working Hours', 'Salary'],
            staff.map((s) => [s.name, s.fatherName, s.cnic, s.contact, s.gender, s.role, s.workingHours, Number(s.salary ?? 0)]),
        );
        return new Response(csv, {
            headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="staff.csv"' },
        });
    }

    return new Response('Unknown export type', { status: 400 });
}
