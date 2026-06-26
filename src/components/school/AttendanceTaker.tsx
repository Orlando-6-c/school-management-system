'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { saveAttendance } from '@/actions/teacher-dashboard';
import { format } from 'date-fns';

export default function AttendanceTaker({ assignments, classStudents, existingAttendance }: { assignments: any[], classStudents: Record<string, any[]>, existingAttendance: Record<string, any[]> }) {
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [date, setDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
    const [isPending, startTransition] = useTransition();

    // Local state for fast toggling before saving
    const [records, setRecords] = useState<Record<string, { isPresent: boolean, remarks: string }>>({});

    // When class or date changes, sync local state with existing DB records
    const handleLoadRecords = (classId: string, inputDate: string) => {
        setSelectedClassId(classId);
        setDate(inputDate);
        if (!classId) return;

        const studentsInClass = classStudents[classId] || [];
        const dateKey = `${classId}-${inputDate}`;
        const previousRecords = existingAttendance[dateKey] || [];

        const newRecords: Record<string, { isPresent: boolean, remarks: string }> = {};

        studentsInClass.forEach(s => {
            const prev = previousRecords.find(p => p.studentId === s.id);
            newRecords[s.id] = {
                isPresent: prev ? prev.isPresent : true, // Default to true functionally
                remarks: prev?.remarks || ''
            };
        });
        setRecords(newRecords);
    };

    const toggleStudent = (studentId: string, checked: boolean) => {
        setRecords(prev => ({
            ...prev,
            [studentId]: { ...prev[studentId], isPresent: checked }
        }));
    };

    const handleSave = () => {
        if (!selectedClassId || !date) return;

        startTransition(async () => {
            const payload = Object.keys(records).map(id => ({
                studentId: id,
                isPresent: records[id].isPresent,
                remarks: records[id].remarks
            }));

            const result = await saveAttendance(selectedClassId, date, payload);
            if (result.success) alert("Saved Successfully");
            else alert(result.message);
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6 p-6 bg-white border border-border rounded-xl shadow-sm">
                <div className="space-y-2 flex-1">
                    <Label>Target Class</Label>
                    <Select value={selectedClassId} onValueChange={(val) => handleLoadRecords(val, date)}>
                        <SelectTrigger><SelectValue placeholder="Select a class you are assigned to" /></SelectTrigger>
                        <SelectContent>
                            {assignments.map(a => (
                                <SelectItem key={a.class.id} value={a.class.id}>{a.class.name} {a.class.section ? `(${a.class.section})` : ''}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2 flex-1">
                    <Label>Date</Label>
                    <Input type="date" value={date} onChange={(e) => handleLoadRecords(selectedClassId, e.target.value)} required />
                </div>
            </div>

            {selectedClassId && (
                <div className="bg-white border text-foreground border-border rounded-xl shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between p-4 bg-muted border-b border-border">
                        <label className="flex items-center space-x-2 font-bold select-none cursor-pointer text-indigo-700">
                            <Checkbox
                                id="markAll"
                                checked={Object.values(records).every(v => v.isPresent)}
                                onCheckedChange={(c) => {
                                    const next = { ...records };
                                    Object.keys(next).forEach(k => next[k].isPresent = !!c);
                                    setRecords(next);
                                }}
                            />
                            <span>Mark All Present</span>
                        </label>
                        <Button onClick={handleSave} disabled={isPending}>{isPending ? 'Syncing...' : 'Save Attendance'}</Button>
                    </div>

                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted px-4 py-3 border-b border-border font-medium">
                            <tr>
                                <th className="px-6 py-3 w-[100px] text-center">Status</th>
                                <th className="px-6 py-3">Roll Number</th>
                                <th className="px-6 py-3">Student Name</th>
                                <th className="px-6 py-3 text-right">Remarks (Optional)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {Object.keys(records).length === 0 ? (
                                <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No active students found in this class.</td></tr>
                            ) : Object.keys(records).map(studentId => {
                                const studentInfo = (classStudents[selectedClassId] || []).find(s => s.id === studentId);
                                if (!studentInfo) return null;

                                const isPresent = records[studentId].isPresent;
                                return (
                                    <tr key={studentId} className={`transition-colors ${!isPresent ? 'bg-red-50/50' : 'hover:bg-muted/30'}`}>
                                        <td className="px-6 py-3 text-center">
                                            <Checkbox
                                                checked={isPresent}
                                                onCheckedChange={(c) => toggleStudent(studentId, !!c)}
                                                className="w-5 h-5"
                                            />
                                        </td>
                                        <td className="px-6 py-3 font-mono text-muted-foreground">{studentInfo.rollNumber}</td>
                                        <td className={`px-6 py-3 font-semibold ${!isPresent ? 'text-red-700' : ''}`}>{studentInfo.name}</td>
                                        <td className="px-6 py-3 text-right">
                                            <Input
                                                placeholder="e.g. Medical leave"
                                                value={records[studentId].remarks}
                                                onChange={(e) => setRecords(prev => ({
                                                    ...prev,
                                                    [studentId]: { ...prev[studentId], remarks: e.target.value }
                                                }))}
                                                className="h-8 max-w-[200px] ml-auto bg-transparent"
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
