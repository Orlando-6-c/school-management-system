// src/components/school/ChallanStudentTable.tsx
'use client';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';

interface Student {
    id: string;
    name: string;
    rollNumber: string;
    class: {
        name: string;
        section: string | null;
    } | null;
    // Add other relevant student properties
}

interface ChallanStudentTableProps {
    students: Student[];
    selectedStudents: Set<string>;
    onSelectionChange: (selected: Set<string>) => void;
}

export function ChallanStudentTable({ students, selectedStudents, onSelectionChange }: ChallanStudentTableProps) {

    const handleSelectAll = (checked: boolean) => {
        const newSelection = new Set<string>();
        if (checked) {
            students.forEach(student => newSelection.add(student.id));
        }
        onSelectionChange(newSelection);
    };

    const handleSelectRow = (studentId: string, checked: boolean) => {
        const newSelection = new Set(selectedStudents);
        if (checked) {
            newSelection.add(studentId);
        } else {
            newSelection.delete(studentId);
        }
        onSelectionChange(newSelection);
    };

    const isAllSelected = students.length > 0 && selectedStudents.size === students.length;

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-[50px]">
                        <Checkbox
                            checked={isAllSelected}
                            onCheckedChange={handleSelectAll}
                            aria-label="Select all rows"
                        />
                    </TableHead>
                    <TableHead>Roll No</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Guardian</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {students.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                            No students match the current filters.
                        </TableCell>
                    </TableRow>
                ) : (
                    students.map((student) => (
                        <TableRow key={student.id} selected={selectedStudents.has(student.id)}>
                            <TableCell>
                                <Checkbox
                                    checked={selectedStudents.has(student.id)}
                                    onCheckedChange={(checked) => handleSelectRow(student.id, !!checked)}
                                    aria-label={`Select row for ${student.name}`}
                                />
                            </TableCell>
                            <TableCell className="font-medium">{student.rollNumber}</TableCell>
                            <TableCell>{student.name}</TableCell>
                            <TableCell>
                                {student.class?.name ?? 'N/A'} {student.class?.section ? `(${student.class.section})` : ''}
                            </TableCell>
                            <TableCell>
                                {/* @ts-ignore */}
                                {student.guardian?.name || 'N/A'}
                            </TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
    );
}
