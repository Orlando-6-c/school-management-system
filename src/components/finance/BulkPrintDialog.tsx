'use client';

import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Printer } from 'lucide-react';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const STATUSES = ['Pending','Paid','Overdue','Cancelled'];

function CheckList({
    items,
    selected,
    onToggle,
    onToggleAll,
    placeholder,
    renderLabel,
    allSelected,
}: {
    items: { id: string }[];
    selected: string[];
    onToggle: (id: string) => void;
    onToggleAll: () => void;
    placeholder: string;
    renderLabel: (item: any) => string;
    allSelected: boolean;
}) {
    const [search, setSearch] = useState('');
    const filtered = items.filter(i => renderLabel(i).toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="border border-border rounded-lg overflow-hidden">
            <div className="px-3 py-2 border-b border-border bg-muted/30 flex items-center gap-2">
                <Input
                    placeholder={placeholder}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="h-7 text-xs bg-card"
                />
                <button type="button" onClick={onToggleAll} className="text-xs text-muted-foreground whitespace-nowrap hover:text-foreground shrink-0">
                    {allSelected ? 'Clear all' : 'Select all'}
                </button>
            </div>
            <div className="max-h-36 overflow-y-auto divide-y divide-border">
                {filtered.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-muted-foreground">No results.</p>
                ) : (
                    filtered.map((item: any) => (
                        <label key={item.id} className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-muted/30 text-sm select-none">
                            <Checkbox checked={selected.includes(item.id)} onCheckedChange={() => onToggle(item.id)} />
                            {renderLabel(item)}
                        </label>
                    ))
                )}
            </div>
            {selected.length > 0 && (
                <div className="px-3 py-1.5 border-t border-border bg-muted/20 text-xs text-muted-foreground">
                    {selected.length} of {items.length} selected
                </div>
            )}
        </div>
    );
}

interface Student { id: string; name: string; rollNumber: string; classId: string | null }
interface ClassItem { id: string; name: string; section: string | null }

interface Props {
    open: boolean;
    onClose: () => void;
    students: Student[];
    classes: ClassItem[];
    availableYears: string[];
}

export default function BulkPrintDialog({ open, onClose, students, classes, availableYears }: Props) {
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
    const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
    const [month, setMonth] = useState('all');
    const [year, setYear] = useState('all');
    const [status, setStatus] = useState('all');

    const studentsByClass = useMemo(() => {
        const map = new Map<string, string[]>();
        for (const s of students) {
            if (s.classId) {
                const arr = map.get(s.classId) ?? [];
                arr.push(s.id);
                map.set(s.classId, arr);
            }
        }
        return map;
    }, [students]);

    const classOfStudent = useMemo(() => {
        const map = new Map<string, string>();
        for (const s of students) {
            if (s.classId) map.set(s.id, s.classId);
        }
        return map;
    }, [students]);

    function toggleClass(classId: string) {
        const classStudentIds = studentsByClass.get(classId) ?? [];
        if (selectedClassIds.includes(classId)) {
            setSelectedClassIds(prev => prev.filter(id => id !== classId));
            setSelectedStudentIds(prev => prev.filter(id => !classStudentIds.includes(id)));
        } else {
            setSelectedClassIds(prev => [...prev, classId]);
            setSelectedStudentIds(prev => [...new Set([...prev, ...classStudentIds])]);
        }
    }

    function toggleAllClasses() {
        if (selectedClassIds.length === classes.length) {
            const allClassStudents = new Set(students.filter(s => s.classId).map(s => s.id));
            setSelectedClassIds([]);
            setSelectedStudentIds(prev => prev.filter(id => !allClassStudents.has(id)));
        } else {
            setSelectedClassIds(classes.map(c => c.id));
            setSelectedStudentIds(students.map(s => s.id));
        }
    }

    function toggleStudent(studentId: string) {
        const studentClassId = classOfStudent.get(studentId);
        if (selectedStudentIds.includes(studentId)) {
            setSelectedStudentIds(prev => prev.filter(id => id !== studentId));
            if (studentClassId) setSelectedClassIds(prev => prev.filter(id => id !== studentClassId));
        } else {
            const newStudentIds = [...selectedStudentIds, studentId];
            setSelectedStudentIds(newStudentIds);
            if (studentClassId) {
                const classStudentIds = studentsByClass.get(studentClassId) ?? [];
                if (classStudentIds.every(id => newStudentIds.includes(id)) && !selectedClassIds.includes(studentClassId)) {
                    setSelectedClassIds(prev => [...prev, studentClassId]);
                }
            }
        }
    }

    function toggleAllStudents() {
        if (selectedStudentIds.length === students.length) {
            setSelectedStudentIds([]);
            setSelectedClassIds([]);
        } else {
            setSelectedStudentIds(students.map(s => s.id));
            setSelectedClassIds(classes.map(c => c.id));
        }
    }

    function handlePrint() {
        const params = new URLSearchParams();
        if (selectedStudentIds.length) params.set('sids', selectedStudentIds.join(','));
        if (selectedClassIds.length) params.set('cids', selectedClassIds.join(','));
        if (month !== 'all') params.set('month', month);
        if (year !== 'all') params.set('year', year);
        if (status !== 'all') params.set('status', status);
        window.open(`/school/finance/challan/bulk-print?${params.toString()}`, '_blank');
    }

    const canPrint = selectedStudentIds.length > 0 || selectedClassIds.length > 0;

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Printer className="h-4 w-4" />
                        Bulk Print Challans
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-5 pt-1">
                    {/* Filters */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-xs">Month</Label>
                            <Select value={month} onValueChange={setMonth}>
                                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Months</SelectItem>
                                    {MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">Year</Label>
                            <Select value={year} onValueChange={setYear}>
                                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Years</SelectItem>
                                    {availableYears.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">Status</Label>
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Class checklist */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Classes</Label>
                        <CheckList
                            items={classes}
                            selected={selectedClassIds}
                            onToggle={toggleClass}
                            onToggleAll={toggleAllClasses}
                            placeholder="Search classes…"
                            renderLabel={(c) => `${c.name}${c.section ? ` (${c.section})` : ''}`}
                            allSelected={selectedClassIds.length === classes.length && classes.length > 0}
                        />
                    </div>

                    {/* Student checklist */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Students</Label>
                        <CheckList
                            items={students}
                            selected={selectedStudentIds}
                            onToggle={toggleStudent}
                            onToggleAll={toggleAllStudents}
                            placeholder="Search students…"
                            renderLabel={(s) => `${s.name} (${s.rollNumber})`}
                            allSelected={selectedStudentIds.length === students.length && students.length > 0}
                        />
                    </div>

                    {!canPrint && (
                        <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 rounded px-3 py-2">
                            Select at least one student or class to print challans.
                        </p>
                    )}

                    <div className="flex justify-end gap-2 pt-1 border-t border-border">
                        <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
                        <Button size="sm" onClick={handlePrint} disabled={!canPrint}>
                            <Printer className="h-4 w-4 mr-1.5" />
                            Open Print Preview
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
