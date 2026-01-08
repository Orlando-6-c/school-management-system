'use client';

import { useActionState, useState } from 'react';
import { createClass } from '@/actions/academics';
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
    DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Plus } from 'lucide-react';

interface Teacher {
    id: string;
    name: string;
}

interface CreateClassDialogProps {
    teachers: Teacher[];
}

export function CreateClassDialog({ teachers }: CreateClassDialogProps) {
    const [open, setOpen] = useState(false);
    const [state, action, pending] = useActionState(createClass, undefined);

    // Close dialog on success
    if (state?.success && open) {
        setOpen(false);
    }

    const inputClasses = "bg-white text-gray-900 border-gray-300 focus:ring-gray-400 focus:border-gray-400";

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Class
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-white text-gray-900">
                <DialogHeader>
                    <DialogTitle>Create New Class</DialogTitle>
                    <DialogDescription>
                        Add a new class to your school.
                    </DialogDescription>
                </DialogHeader>
                <form action={action} className="grid gap-4 py-4">
                    {state?.message && (
                        <div className={`text-sm p-2 rounded ${state.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {state.message}
                        </div>
                    )}

                    <div className="grid gap-2">
                        <Label htmlFor="name" className="text-gray-700">Class Name</Label>
                        <select
                            name="name"
                            id="name"
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
                        </select>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="section" className="text-gray-700">Section (Optional)</Label>
                        <Input id="section" name="section" placeholder="e.g. A, Blue, Gold" className={inputClasses} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="monthlyTuitionFee" className="text-gray-700">Monthly Tuition Fee</Label>
                        <Input id="monthlyTuitionFee" name="monthlyTuitionFee" type="number" min="0" defaultValue="0" required className={inputClasses} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="classTeacherId" className="text-gray-700">Designated Class Teacher (Optional)</Label>
                        <select
                            name="classTeacherId"
                            id="classTeacherId"
                            className={`flex h-10 w-full rounded-md border border-input px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${inputClasses}`}
                        >
                            <option value="">Select Teacher</option>
                            {teachers.map((teacher) => (
                                <option key={teacher.id} value={teacher.id}>
                                    {teacher.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={pending} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                            {pending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                'Create Class'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
