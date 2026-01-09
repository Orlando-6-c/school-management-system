// src/components/finance/IncomeTable.tsx
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
import { IncomeCategory } from '@prisma/client';

// Define the structure of an income record
interface IncomeRecord {
    id: string;
    transactionId: string;
    description: string;
    amount: number;
    category: IncomeCategory;
    source: string;
    paymentMethod: string;
    date: Date;
    student?: { // Optional student details
        id: string;
        name: string;
        rollNumber: string;
    } | null;
    isAutomatic: boolean;
    createdAt: Date;
}

interface IncomeTableProps {
    incomeRecords: IncomeRecord[];
}

export default function IncomeTable({ incomeRecords }: IncomeTableProps) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {incomeRecords.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={8} className="text-center h-24 text-gray-500">
                            No income records found.
                        </TableCell>
                    </TableRow>
                ) : (
                    incomeRecords.map((record) => (
                        <TableRow key={record.id}>
                            <TableCell className="font-medium">{record.transactionId}</TableCell>
                            <TableCell>{format(new Date(record.date), 'dd MMM yyyy')}</TableCell>
                            <TableCell>{record.category}</TableCell>
                            <TableCell>{record.source}</TableCell>
                            <TableCell>{record.description}</TableCell>
                            <TableCell>{record.student?.name || 'N/A'}</TableCell>
                            <TableCell>{record.paymentMethod}</TableCell>
                            <TableCell className="text-right">{record.amount.toFixed(2)}</TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
    );
}
