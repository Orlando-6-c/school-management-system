'use client';

import { useActionState, useEffect } from 'react';
import { createHomework, deleteHomework } from '@/actions/teacher-dashboard';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';

export default function HomeworkManager({ assignments, homeworks }: { assignments: any[], homeworks: any[] }) {
    const [state, formAction, isPending] = useActionState(createHomework, { success: false, message: '' });

    useEffect(() => {
        if (state.success) alert("Homework posted Successfully!");
        else if (state.message) alert(state.message);
    }, [state]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
                <form action={formAction} className="bg-card p-6 rounded-xl border border-border mt-0 shadow-sm space-y-4 sticky top-6">
                    <h3 className="text-lg font-semibold text-foreground">Post New Homework</h3>

                    <div className="space-y-2">
                        <Label>Target Class</Label>
                        <Select name="classId" required>
                            <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
                            <SelectContent>
                                {assignments.map(a => (
                                    <SelectItem key={a.classId} value={a.classId}>{a.class.name} {a.class.section ? `(${a.class.section})` : ''}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Subject</Label>
                        <Select name="subject" required>
                            <SelectTrigger><SelectValue placeholder="Select Subject" /></SelectTrigger>
                            <SelectContent>
                                {assignments.map((a, i) => (
                                    <SelectItem key={`${a.classId}-${a.subject}-${i}`} value={a.subject}>{a.subject} ({a.class.name})</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Title</Label>
                        <Input name="title" placeholder="e.g. Chapter 4 Exercises" required />
                    </div>

                    <div className="space-y-2">
                        <Label>Description / Tasks</Label>
                        <Textarea name="description" placeholder="Write the specific tasks students must complete..." required className="min-h-[100px]" />
                    </div>

                    <div className="space-y-2">
                        <Label>Due Date</Label>
                        <Input type="date" name="dueDate" required defaultValue={format(new Date(), 'yyyy-MM-dd')} />
                    </div>

                    <Button type="submit" disabled={isPending} className="w-full">
                        {isPending ? 'Posting...' : 'Post Homework'}
                    </Button>
                </form>
            </div>

            <div className="lg:col-span-2">
                <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden text-foreground">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted px-4 py-3 border-b border-border font-medium">
                            <tr>
                                <th className="px-6 py-3">Class & Subject</th>
                                <th className="px-6 py-3">Title & Due Date</th>
                                <th className="px-6 py-3 min-w-[200px]">Description</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {homeworks.length === 0 ? (
                                <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No active homework assignments right now.</td></tr>
                            ) : homeworks.map(h => (
                                <tr key={h.id} className="hover:bg-muted/30">
                                    <td className="px-6 py-4 font-medium whitespace-nowrap">
                                        <div className="text-indigo-700 font-bold">{h.class.name} {h.class.section ? `(${h.class.section})` : ''}</div>
                                        <div className="text-xs text-muted-foreground">{h.subject}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="font-semibold">{h.title}</div>
                                        <div className={`text-xs mt-1 ${new Date(h.dueDate) < new Date() ? 'text-red-500 font-bold' : 'text-emerald-600'}`}>
                                            Due: {format(new Date(h.dueDate), 'MMM dd, yyyy')}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-muted-foreground">
                                        {h.description}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Button variant="destructive" size="sm" onClick={async () => {
                                            if (confirm('Delete this homework permanently?')) {
                                                await deleteHomework(h.id);
                                            }
                                        }}>Remove</Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
