// src/components/finance/SalarySlipTable.tsx
'use client';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { EmployeeRole } from '@prisma/client';

// Define the structure of a salary slip record
interface SalarySlip {
    id: string;
    slipNumber: string;
    month: string;
    year: number;
    baseSalary: number;
    allowances: number;
    deductions: number;
    bonuses: number;
    netSalary: number;
    paidAt: Date;
    employeeType: EmployeeRole;
    teacher?: { id: string; firstName: string; lastName: string } | null;
    staff?: { id: string; name: string } | null;
    executive?: { id: string; name: string } | null;
    expenseRecord?: { transactionId: string } | null;
}

interface SalarySlipTableProps {
    salarySlips: SalarySlip[];
}

export default function SalarySlipTable({ salarySlips }: SalarySlipTableProps) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Slip No</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Month/Year</TableHead>
                    <TableHead className="text-right">Base</TableHead>
                    <TableHead className="text-right">Allowances</TableHead>
                    <TableHead className="text-right">Deductions</TableHead>
                    <TableHead className="text-right">Net Pay</TableHead>
                    <TableHead>Paid At</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {salarySlips.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={9} className="text-center h-24 text-gray-500">
                            No salary slips found.
                        </TableCell>
                    </TableRow>
                ) : (
                    salarySlips.map((slip) => (
                        <TableRow key={slip.id}>
                            <TableCell className="font-medium">{slip.slipNumber}</TableCell>
                            <TableCell>
                                {slip.employeeType === 'Teacher' && slip.teacher ? `${slip.teacher.firstName} ${slip.teacher.lastName}` :
                                 slip.employeeType === 'Staff' && slip.staff ? slip.staff.name :
                                 slip.employeeType === 'Executive' && slip.executive ? slip.executive.name : 'N/A'}
                            </TableCell>
                            <TableCell>{slip.employeeType}</TableCell>
                            <TableCell>{slip.month} {slip.year}</TableCell>
                            <TableCell className="text-right">{slip.baseSalary.toFixed(2)}</TableCell>
                            <TableCell className="text-right">{slip.allowances.toFixed(2)}</TableCell>
                            <TableCell className="text-right">{slip.deductions.toFixed(2)}</TableCell>
                            <TableCell className="text-right font-bold">{slip.netSalary.toFixed(2)}</TableCell>
                            <TableCell>{format(new Date(slip.paidAt), 'dd MMM yyyy')}</TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
    );
}
