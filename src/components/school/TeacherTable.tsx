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
import { Edit, Printer, Trash } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { deleteTeacher } from '@/actions/teacher';


interface TeacherTableProps {
    teachers: any[]; // Replace 'any' with actual Teacher type later
    session: any; // Assuming Session type is exported from '@/lib/session'
}

export function TeacherTable({ teachers, session }: TeacherTableProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [teacherToDelete, setTeacherToDelete] = useState<{ id: string; name: string } | null>(null);
    const [deletionReason, setDeletionReason] = useState('');

    const handleDeleteClick = (teacher: { id: string; name: string }) => {
        setTeacherToDelete(teacher);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (teacherToDelete) {
            startTransition(async () => {
                const result = await deleteTeacher(teacherToDelete.id, deletionReason);
                if (result.success) {
                    router.refresh();
                    setIsDeleteDialogOpen(false);
                    setTeacherToDelete(null);
                    setDeletionReason('');
                } else {
                    alert(result.message || 'Failed to delete teacher.');
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
                        <TableHead>Name</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Qualification</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Salary</TableHead>
                        <TableHead>Account</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {teachers.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center py-12">
                                <div className="flex flex-col items-center gap-3">
                                    <p className="text-muted-foreground text-sm font-medium">No teachers found.</p>
                                    <p className="text-gray-400 text-xs">Add your first teacher to get started.</p>
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : (
                        teachers.map((teacher: any) => (
                            <TableRow key={teacher.id}>
                                <TableCell>
                                    <div className="relative h-10 w-10 rounded-full overflow-hidden bg-muted">
                                        {teacher.photograph ? (
                                            <img
                                                src={teacher.photograph}
                                                alt={`${teacher.firstName} ${teacher.lastName}`}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full w-full text-xs text-muted-foreground">
                                                {teacher.firstName[0]}
                                            </div>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="font-medium text-foreground">
                                    {teacher.firstName} {teacher.lastName}
                                    <div className="text-xs text-muted-foreground">{teacher.email}</div>
                                </TableCell>
                                <TableCell>{teacher.subject}</TableCell>
                                <TableCell>{teacher.qualification}</TableCell>
                                <TableCell>{teacher.phone}</TableCell>
                                <TableCell>
                                    {teacher.salary
                                        ? typeof teacher.salary === 'number'
                                            ? teacher.salary.toLocaleString()
                                            : Number(teacher.salary).toLocaleString()
                                        : 'N/A'}
                                </TableCell>
                                <TableCell>
                                    <div className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 flex max-w-min rounded">
                                        ID:{teacher.cnic}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground mt-1 tracking-widest uppercase flex flex-col gap-0.5">
                                        <span>Teacher</span>
                                        <span>Pass: {teacher.phone}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Link href={`/school/teachers/${teacher.id}/edit`}>
                                            <Button variant="ghost" size="icon" title="Edit Teacher">
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                        {isAdmin && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                title="Delete Teacher"
                                                onClick={() => handleDeleteClick({ id: teacher.id, name: `${teacher.firstName} ${teacher.lastName}` })}
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
                        <DialogTitle>Delete Teacher {teacherToDelete?.name}</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to soft-delete this teacher? This action cannot be undone.
                            The teacher&apos;s account will be deactivated.
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
