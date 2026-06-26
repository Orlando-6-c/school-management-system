'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Edit, Printer, Trash, Search } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { deleteStudent } from '@/actions/student';


interface StudentTableProps {
    students: any[]; // Replace 'any' with actual Student type later
    session: any; // Assuming Session type is exported from '@/lib/session'
    classes: any[]; // Replace 'any' with actual Class type later
}

export function StudentTable({ students, session, classes }: StudentTableProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [studentToDelete, setStudentToDelete] = useState<{ id: string; name: string } | null>(null);
    const [deletionReason, setDeletionReason] = useState('');

    const handleDeleteClick = (student: { id: string; name: string }) => {
        setStudentToDelete(student);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (studentToDelete) {
            startTransition(async () => {
                const result = await deleteStudent(studentToDelete.id, deletionReason);
                if (result.success) {
                    // Refresh data
                    router.refresh(); // Refreshes the current route, re-fetching data
                    setIsDeleteDialogOpen(false);
                    setStudentToDelete(null);
                    setDeletionReason('');
                } else {
                    alert(result.message || 'Failed to delete student.');
                }
            });
        }
    };

    const isAdmin = session.role === 'SchoolAdmin';

    return (
        <>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[80px]">Photo</TableHead>
                        <TableHead>Roll No</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Guardian</TableHead>
                        <TableHead>Fee</TableHead>
                        <TableHead>Account</TableHead>
                        <TableHead className="text-right print:hidden">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {students.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                                No students found. Admit a student to get started.
                            </TableCell>
                        </TableRow>
                    ) : (
                        students.map((student: any) => (
                            <TableRow key={student.id}>
                                {/* Photo Column */}
                                <TableCell>
                                    {student.photograph ? (
                                        <img
                                            src={student.photograph}
                                            alt={student.name}
                                            className="h-10 w-10 rounded-full object-cover border border-border"
                                        />
                                    ) : (
                                        <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-xs text-gray-400 border border-border">
                                            No Pic
                                        </div>
                                    )}
                                </TableCell>

                                <TableCell className="font-medium text-foreground">
                                    {student.rollNumber}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {student.name}
                                </TableCell>
                                <TableCell>
                                    <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-indigo-700/10">
                                        {student.class?.name ?? 'Unassigned'} {student.class?.section ? `(${student.class.section})` : ''}
                                    </span>
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {student.guardian?.name || 'N/A'}
                                    <div className="text-xs text-gray-400">
                                        {student.guardian?.contact || 'No Contact'}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {Number(student.discountPercentage) > 0 ? (
                                        <div className="flex flex-col">
                                            <span className="text-xs line-through text-gray-400">
                                                {Number(student.monthlyFees)}
                                            </span>
                                            <span className="font-bold text-foreground">
                                                {Number(student.finalFee)}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="font-bold text-foreground">
                                            {Number(student.monthlyFees)}
                                        </span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <div className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 flex max-w-min rounded">
                                        UID:{student.rollNumber}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest flex flex-col gap-0.5">
                                        <span>Role: Student</span>
                                        <span>Pass: {student.rollNumber}</span>
                                    </div>
                                </TableCell>

                                {/* Actions Column */}
                                <TableCell className="text-right print:hidden">
                                    <div className="flex justify-end gap-2">
                                        {/* Edit Button */}
                                        <Button variant="ghost" size="icon" title="Edit Student" asChild>
                                            <Link href={`/school/students/${student.id}/edit`}>
                                                <Edit className="h-4 w-4 text-blue-600" />
                                            </Link>
                                        </Button>

                                        {/* Individual Print Button */}
                                        <Button variant="ghost" size="icon" title="Print Student Info" asChild>
                                            <Link href={`/school/students/${student.id}/print`} target="_blank">
                                                <Printer className="h-4 w-4 text-muted-foreground" />
                                            </Link>
                                        </Button>

                                        {/* Delete Button */}
                                        {isAdmin && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                title="Delete Student"
                                                onClick={() => handleDeleteClick(student)}
                                                disabled={isPending}
                                            >
                                                <Trash className="h-4 w-4 text-red-600" />
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>

            {/* Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Delete Student {studentToDelete?.name}</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to soft-delete this student? This action cannot be undone.
                            The student&apos;s account will be deactivated.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="reason" className="text-right">
                                Reason
                            </Label>
                            <Textarea
                                id="reason"
                                placeholder="Optional reason for deletion"
                                className="col-span-3"
                                value={deletionReason}
                                onChange={(e) => setDeletionReason(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isPending}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={confirmDelete} disabled={isPending}>
                            {isPending ? 'Deleting...' : 'Confirm Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
