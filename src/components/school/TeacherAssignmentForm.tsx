'use client';

import { useActionState, useEffect } from 'react';
import { assignTeacherToClass, removeTeacherAssignment } from '@/actions/academics';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export default function TeacherAssignmentForm({ teachers, classes, assignments }: { teachers: any[], classes: any[], assignments: any[] }) {
    const [state, formAction, isPending] = useActionState(assignTeacherToClass, { success: false, message: '' });

    useEffect(() => {
        if (state.success) {
            alert("Assigned Successfully!");
        } else if (state.message) {
            alert(state.message);
        }
    }, [state]);

    return (
        <div className="space-y-10">
            <form action={formAction} className="bg-white p-6 rounded-xl border border-border shadow-sm space-y-4">
                <h2 className="text-xl font-bold">Assign Teacher</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <Label>Teacher</Label>
                        <Select name="teacherId" required>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Teacher" />
                            </SelectTrigger>
                            <SelectContent>
                                {teachers.map((t) => (
                                    <SelectItem key={t.id} value={t.id}>{t.firstName} {t.lastName} ({t.subject})</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Class</Label>
                        <Select name="classId" required>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Class" />
                            </SelectTrigger>
                            <SelectContent>
                                {classes.map((c) => (
                                    <SelectItem key={c.id} value={c.id}>{c.name} {c.section ? `- ${c.section}` : ''}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Subject to Teach</Label>
                        <Input name="subject" placeholder="e.g. Mathematics" required />
                    </div>
                </div>

                <div className="flex items-center space-x-2 pt-2">
                    <Checkbox id="isClassTeacher" name="isClassTeacher" />
                    <Label htmlFor="isClassTeacher">Make Class Teacher (Homeroom)</Label>
                </div>

                <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={isPending}>{isPending ? 'Assigning...' : 'Assign Teacher'}</Button>
                </div>
            </form>

            <div>
                <h2 className="text-xl font-bold mb-4">Current Assignments</h2>
                <div className="bg-white rounded-xl border border-border overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted px-4 py-3 border-b border-border font-medium">
                            <tr>
                                <th className="px-6 py-3">Teacher</th>
                                <th className="px-6 py-3">Class</th>
                                <th className="px-6 py-3">Subject</th>
                                <th className="px-6 py-3">Role</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {assignments.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">No assignments found</td>
                                </tr>
                            ) : assignments.map(a => (
                                <tr key={a.id} className="border-b border-border/50 hover:bg-muted/30">
                                    <td className="px-6 py-3 font-medium">{a.teacher.firstName} {a.teacher.lastName}</td>
                                    <td className="px-6 py-3">{a.class.name} {a.class.section ? `- ${a.class.section}` : ''}</td>
                                    <td className="px-6 py-3">{a.subject}</td>
                                    <td className="px-6 py-3">{a.isClassTeacher ? <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded border border-indigo-200">Class Teacher</span> : 'Subject Teacher'}</td>
                                    <td className="px-6 py-3 text-right">
                                        <Button variant="destructive" size="sm" onClick={async () => {
                                            if (confirm('Remove this assignment?')) {
                                                await removeTeacherAssignment(a.id);
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
