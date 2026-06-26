'use client';

import { useActionState, useState } from 'react';
import { updateClass, deleteClass } from '@/actions/class';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Edit2, Trash2 } from 'lucide-react';

interface Teacher {
    id: string;
    name: string;
}

interface ClassActionsProps {
    classItem: any;
    teachers: Teacher[];
}

export function ClassActions({ classItem, teachers }: ClassActionsProps) {
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);

    // Bind ID to actions
    const updateClassWithId = updateClass.bind(null, classItem.id);
    const deleteClassWithId = deleteClass.bind(null, classItem.id);

    const [editState, editAction, editPending] = useActionState(updateClassWithId, undefined);
    const [delState, delAction, delPending] = useActionState(deleteClassWithId, undefined);

    if (editState?.success && editOpen) {
        setEditOpen(false);
    }
    if (delState?.success && deleteOpen) {
        setDeleteOpen(false);
    }

    const inputClasses = "bg-card text-foreground border-input focus:ring-gray-400 focus:border-gray-400";

    const currentTeacherId = classItem.teacherAssignments?.[0]?.teacherId || '';
    const currentNameValue = classItem.gradeLevel !== undefined && classItem.gradeLevel !== null
        ? `${classItem.name}|${classItem.gradeLevel}`
        : classItem.name;

    return (
        <>
            <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50" onClick={() => setEditOpen(true)} title="Edit Class">
                    <Edit2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50" onClick={() => setDeleteOpen(true)} title="Delete Class">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>

            {/* Edit Dialog */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="sm:max-w-[425px] bg-card text-foreground">
                    <DialogHeader>
                        <DialogTitle>Edit Class</DialogTitle>
                        <DialogDescription>
                            Make changes to {classItem.name} {classItem.section}.
                        </DialogDescription>
                    </DialogHeader>
                    <form action={editAction} className="grid gap-4 py-4">
                        {editState?.message && (
                            <div className={`text-sm p-2 rounded ${editState.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {editState.message}
                            </div>
                        )}

                        <div className="grid gap-2">
                            <Label htmlFor="name" className="text-muted-foreground">Class Name</Label>
                            <select
                                name="name"
                                id="name"
                                defaultValue={currentNameValue}
                                className={`flex h-10 w-full rounded-md border border-input px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${inputClasses}`}
                                required
                            >
                                <option value="">Select Grade Level</option>
                                <option value="Play Group|0">Play Group</option>
                                <option value="Nursery|1">Nursery</option>
                                <option value="Prep|2">Prep</option>
                                <option value="Grade 1|3">Grade 1</option>
                                <option value="Grade 2|4">Grade 2</option>
                                <option value="Grade 3|5">Grade 3</option>
                                <option value="Grade 4|6">Grade 4</option>
                                <option value="Grade 5|7">Grade 5</option>
                                <option value="Grade 6|8">Grade 6</option>
                                <option value="Grade 7|9">Grade 7</option>
                                <option value="Grade 8|10">Grade 8</option>
                                <option value="Grade 9|11">Grade 9</option>
                                <option value="Grade 10|12">Grade 10</option>
                                {/* Fallback in case raw name is used */}
                                <option value={classItem.name} className="hidden">{classItem.name}</option>
                            </select>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="section" className="text-muted-foreground">Section (Optional)</Label>
                            <Input id="section" name="section" defaultValue={classItem.section || ''} placeholder="e.g. A, Blue, Gold" className={inputClasses} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="monthlyTuitionFee" className="text-muted-foreground">Monthly Tuition Fee</Label>
                            <Input id="monthlyTuitionFee" name="monthlyTuitionFee" type="number" min="0" defaultValue={classItem.monthlyTuitionFee?.toString() || "0"} required className={inputClasses} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="classTeacherId" className="text-muted-foreground">Designated Class Teacher (Optional)</Label>
                            <select
                                name="classTeacherId"
                                id="classTeacherId"
                                defaultValue={currentTeacherId}
                                className={`flex h-10 w-full rounded-md border border-input px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${inputClasses}`}
                            >
                                <option value="">None</option>
                                {teachers.map((teacher) => (
                                    <option key={teacher.id} value={teacher.id}>
                                        {teacher.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <DialogFooter>
                            <Button type="submit" disabled={editPending} className="bg-primary hover:bg-primary text-white">
                                {editPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    'Save Changes'
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent className="sm:max-w-[425px] bg-white">
                    <DialogHeader>
                        <DialogTitle className="text-red-600">Delete Class</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <strong>{classItem.name} {classItem.section}</strong>? This action will archive the class safely but remove it from the primary Academics view.
                        </DialogDescription>
                    </DialogHeader>
                    <form action={delAction}>
                        {delState?.message && (
                            <div className={`mb-4 text-sm p-2 rounded bg-red-100 text-red-700`}>
                                {delState.message}
                            </div>
                        )}
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={delPending} variant="destructive">
                                {delPending ? 'Processing...' : 'Delete Permanently'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
