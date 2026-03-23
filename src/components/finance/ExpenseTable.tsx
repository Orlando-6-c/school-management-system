// src/components/finance/ExpenseTable.tsx
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
import { ExpenseCategory } from '@prisma/client';

// Define the structure of an expense record
interface ExpenseRecord {
    id: string;
    transactionId: string;
    description: string;
    amount: number;
    category: ExpenseCategory;
    paidTo: string;
    paymentMethod: string;
    date: Date;
    isAutomatic: boolean;
    createdAt: Date;
}

interface ExpenseTableProps {
    expenseRecords: ExpenseRecord[];
}

export default function ExpenseTable({ expenseRecords }: ExpenseTableProps) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Paid To</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {expenseRecords.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={7} className="text-center py-12">
                            <div className="flex flex-col items-center gap-2">
                                <p className="text-muted-foreground text-sm">No expense records found.</p>
                                <p className="text-gray-400 text-xs">Add your first expense record to get started.</p>
                            </div>
                        </TableCell>
                    </TableRow>
                ) : (
                    expenseRecords.map((record) => (
                        <TableRow key={record.id}>
                            <TableCell className="font-medium">{record.transactionId}</TableCell>
                            <TableCell>{format(new Date(record.date), 'dd MMM yyyy')}</TableCell>
                            <TableCell>{record.category}</TableCell>
                            <TableCell>{record.description}</TableCell>
                            <TableCell>{record.paidTo}</TableCell>
                            <TableCell>{record.paymentMethod}</TableCell>
                            <TableCell className="text-right">{record.amount.toFixed(2)}</TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
    );
}
