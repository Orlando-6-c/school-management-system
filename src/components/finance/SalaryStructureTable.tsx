// src/components/finance/SalaryStructureTable.tsx
'use client';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';

// Define the structure of a salary structure record
interface SalaryStructure {
    id: string;
    name: string;
    baseSalary: number;
    allowances: number;
    deductions: number;
    createdAt: Date;
    updatedAt: Date;
}

interface SalaryStructureTableProps {
    salaryStructures: SalaryStructure[];
}

export default function SalaryStructureTable({ salaryStructures }: SalaryStructureTableProps) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Base Salary</TableHead>
                    <TableHead className="text-right">Allowances</TableHead>
                    <TableHead className="text-right">Deductions</TableHead>
                    <TableHead className="text-right">Net Salary</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {salaryStructures.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center h-24 text-gray-500">
                            No salary structures found.
                        </TableCell>
                    </TableRow>
                ) : (
                    salaryStructures.map((structure) => (
                        <TableRow key={structure.id}>
                            <TableCell className="font-medium">{structure.name}</TableCell>
                            <TableCell className="text-right">{structure.baseSalary.toFixed(2)}</TableCell>
                            <TableCell className="text-right">{structure.allowances.toFixed(2)}</TableCell>
                            <TableCell className="text-right">{structure.deductions.toFixed(2)}</TableCell>
                            <TableCell className="text-right">
                                {(structure.baseSalary + structure.allowances - structure.deductions).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="icon" asChild>
                                    <Link href={`/school/finance/salary-structures/${structure.id}/edit`}>
                                        <Edit className="h-4 w-4" />
                                    </Link>
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
    );
}
