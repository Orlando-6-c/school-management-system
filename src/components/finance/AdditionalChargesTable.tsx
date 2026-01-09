// src/components/finance/AdditionalChargesTable.tsx
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
import { ChargeType, IncomeCategory } from '@prisma/client';

// Define the structure of an additional charge record
interface AdditionalCharge {
    id: string;
    name: string;
    type: ChargeType;
    amount: number;
    applicableMonths: string[];
    incomeCategory: IncomeCategory;
    student?: {
        id: string;
        name: string;
        rollNumber: string;
    } | null;
    class?: {
        id: string;
        name: string;
        section: string | null;
    } | null;
    createdAt: Date;
}

interface AdditionalChargesTableProps {
    additionalCharges: AdditionalCharge[];
}

export default function AdditionalChargesTable({ additionalCharges }: AdditionalChargesTableProps) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Charge Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Applicable To</TableHead>
                    <TableHead>Months</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {additionalCharges.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center h-24 text-gray-500">
                            No additional charges found.
                        </TableCell>
                    </TableRow>
                ) : (
                    additionalCharges.map((charge) => (
                        <TableRow key={charge.id}>
                            <TableCell className="font-medium">{charge.name}</TableCell>
                            <TableCell>{charge.type}</TableCell>
                            <TableCell>{charge.incomeCategory}</TableCell>
                            <TableCell>
                                {charge.student ? (
                                    <span>{charge.student.name} ({charge.student.rollNumber})</span>
                                ) : charge.class ? (
                                    <span>{charge.class.name} {charge.class.section ? `(${charge.class.section})` : ''}</span>
                                ) : (
                                    'All Students'
                                )}
                            </TableCell>
                            <TableCell>
                                {charge.type === 'Recurring' ? (charge.applicableMonths.join(', ') || 'All') : 'N/A'}
                            </TableCell>
                            <TableCell className="text-right">{charge.amount.toFixed(2)}</TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
    );
}
