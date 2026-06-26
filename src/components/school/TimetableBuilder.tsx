'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { saveBulkTimetable } from '@/actions/timetable';
import { Printer, Settings, Save, CheckCircle, Clock, Wand2, Plus, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const ACTIVE_DAYS_DEFAULT = [1, 2, 3, 4, 5]; // Default Mon-Fri

export default function TimetableBuilder({ classes, teachers, timetables }: { classes: any[], teachers: any[], timetables: any[] }) {
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [isPending, startTransition] = useTransition();

    // Configuration View State
    const [showConfig, setShowConfig] = useState(false);

    // Grid Generation Specs
    const [startTimeRaw, setStartTimeRaw] = useState('08:00');
    const [lectureDuration, setLectureDuration] = useState(40);
    const [breakDuration, setBreakDuration] = useState(5);
    const [lunchDuration, setLunchDuration] = useState(30);
    const [lunchAfterLecture, setLunchAfterLecture] = useState(4);
    const [lecturesPerDay, setLecturesPerDay] = useState(7);

    // Auto-Generated Matrix Memory Array mapping to UI visual grid
    const [gridTemplate, setGridTemplate] = useState<{ id: number; type: 'Lecture' | 'Break' | 'Lunch'; startTime: string; endTime: string }[]>([]);

    // Actual Input values representing what is mapped to the active generic grid: dayIndex -> templateId -> { subject, teacherId }
    const [matrixPayload, setMatrixPayload] = useState<Record<number, Record<number, { subject: string, teacherId: string }>>>({});

    // Popover Editor State
    const [editingCell, setEditingCell] = useState<{ dayIdx: number, slotId: number } | null>(null);
    const [editSubject, setEditSubject] = useState('');
    const [editTeacher, setEditTeacher] = useState('');

    // Auto-Generator State
    const [allocations, setAllocations] = useState<{ id: string, subject: string, teacherId: string, frequency: number }[]>([]);
    const [newAllocSubject, setNewAllocSubject] = useState('');
    const [newAllocTeacher, setNewAllocTeacher] = useState('');
    const [newAllocFreq, setNewAllocFreq] = useState(1);
    const [showAutoFillPanel, setShowAutoFillPanel] = useState(false);

    const runAutoFill = () => {
        const availableDaysCount = ACTIVE_DAYS_DEFAULT.length;

        for (const alloc of allocations) {
            if (alloc.frequency > availableDaysCount) {
                alert(`Error: Subject ${alloc.subject} has a frequency (${alloc.frequency}) greater than available days (${availableDaysCount}). A subject cannot be assigned more than once per day.`);
                return;
            }
        }

        const lectureSlots = gridTemplate.filter(s => s.type === 'Lecture');
        const totalAvailableSlots = availableDaysCount * lectureSlots.length;
        const totalRequestedSlots = allocations.reduce((sum, a) => sum + a.frequency, 0);

        if (totalRequestedSlots > totalAvailableSlots) {
            alert(`Error: Total requested lectures (${totalRequestedSlots}) exceed total available slots (${totalAvailableSlots}) in the week. Adjust the config to add more lectures per day.`);
            return;
        }

        const newMatrix: Record<number, Record<number, { subject: string, teacherId: string }>> = {};
        ACTIVE_DAYS_DEFAULT.forEach(d => newMatrix[d] = {});

        const availableSlotsPerDay: Record<number, number[]> = {};
        ACTIVE_DAYS_DEFAULT.forEach(d => {
            availableSlotsPerDay[d] = [...lectureSlots.map(s => s.id)];
        });

        const sortedAllocations = [...allocations].sort((a, b) => b.frequency - a.frequency);

        for (const alloc of sortedAllocations) {
            const validDays = ACTIVE_DAYS_DEFAULT.filter(d => {
                if (availableSlotsPerDay[d].length === 0) return false;
                const slotsInDay = Object.values(newMatrix[d]);
                return !slotsInDay.some(s => s.subject === alloc.subject);
            });

            if (validDays.length < alloc.frequency) {
                alert(`Error: Cannot logically fit ${alloc.subject}. Try adjusting break combinations, reducing frequencies, or increasing lectures per day to resolve tight constraints.`);
                return;
            }

            validDays.sort((a, b) => availableSlotsPerDay[b].length - availableSlotsPerDay[a].length);
            const daysToUse = validDays.slice(0, alloc.frequency);

            for (const day of daysToUse) {
                const slotsForDay = availableSlotsPerDay[day];
                const randIdx = Math.floor(Math.random() * slotsForDay.length);
                const pickedSlotId = slotsForDay[randIdx];

                newMatrix[day][pickedSlotId] = { subject: alloc.subject, teacherId: alloc.teacherId };
                slotsForDay.splice(randIdx, 1);
            }
        }

        if (Object.keys(matrixPayload).length > 0) {
            if (!confirm("This will overwrite your existing timetable draft blocks in the grid. Continue?")) return;
        }
        setMatrixPayload(newMatrix);
        setShowAutoFillPanel(false);
    };

    const generateGrid = () => {
        const slots: typeof gridTemplate = [];
        let [hours, mins] = startTimeRaw.split(':').map(Number);

        const advanceTime = (durationMins: number) => {
            const startH = String(hours).padStart(2, '0');
            const startM = String(mins).padStart(2, '0');

            mins += durationMins;
            hours += Math.floor(mins / 60);
            mins = mins % 60;

            const endH = String(hours).padStart(2, '0');
            const endM = String(mins).padStart(2, '0');
            return { startTime: `${startH}:${startM}`, endTime: `${endH}:${endM}` };
        };

        for (let i = 1; i <= lecturesPerDay; i++) {
            const lecTime = advanceTime(lectureDuration);
            slots.push({ id: slots.length, type: 'Lecture', startTime: lecTime.startTime, endTime: lecTime.endTime });

            // Apply Break or Lunch after Lecture
            if (i === lunchAfterLecture) {
                const lunchTime = advanceTime(lunchDuration);
                slots.push({ id: slots.length, type: 'Lunch', startTime: lunchTime.startTime, endTime: lunchTime.endTime });
            } else if (i < lecturesPerDay && breakDuration > 0) {
                const breakTime = advanceTime(breakDuration);
                slots.push({ id: slots.length, type: 'Break', startTime: breakTime.startTime, endTime: breakTime.endTime });
            }
        }

        setGridTemplate(slots);
        setShowConfig(false);
    };

    // Load Class DB to generic grid on select
    const handleClassSelect = (cid: string) => {
        setSelectedClassId(cid);
        const activeTimetable = timetables.filter(t => t.classId === cid);

        // If they have existing generic timestamps, reconstruct a mock grid if possible or rely on manual override
        const reconstructedPayload: Record<number, Record<number, { subject: string, teacherId: string }>> = {};

        activeTimetable.forEach(t => {
            if (!reconstructedPayload[t.dayOfWeek]) reconstructedPayload[t.dayOfWeek] = {};
            // Attempt to bind to existing grid template ID randomly if generated, otherwise relies on exact match string mappings later
            const tempMatch = gridTemplate.find(g => g.startTime === t.startTime && g.endTime === t.endTime);
            if (tempMatch) {
                reconstructedPayload[t.dayOfWeek][tempMatch.id] = { subject: t.subject, teacherId: t.teacherId };
            }
        });

        setMatrixPayload(reconstructedPayload);

        // Auto open config if empty class
        if (activeTimetable.length === 0 && gridTemplate.length === 0) {
            setShowConfig(true);
        }
    };

    const applyCellEdit = () => {
        if (!editingCell) return;
        setMatrixPayload(prev => ({
            ...prev,
            [editingCell.dayIdx]: {
                ...(prev[editingCell.dayIdx] || {}),
                [editingCell.slotId]: { subject: editSubject, teacherId: editTeacher }
            }
        }));
        setEditingCell(null);
    };

    const commitBulkSave = () => {
        if (!selectedClassId) return;

        const finalArray: any[] = [];
        ACTIVE_DAYS_DEFAULT.forEach(dayIdx => {
            gridTemplate.filter(g => g.type === 'Lecture').forEach(slot => {
                const data = matrixPayload[dayIdx]?.[slot.id];
                if (data && data.subject && data.teacherId) {
                    finalArray.push({
                        dayOfWeek: dayIdx,
                        startTime: slot.startTime,
                        endTime: slot.endTime,
                        subject: data.subject,
                        teacherId: data.teacherId
                    });
                }
            });
        });

        startTransition(async () => {
            const res = await saveBulkTimetable(selectedClassId, finalArray);
            alert(res.message);
        });
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between print:hidden">
                <div className="flex-1 w-full max-w-sm">
                    <Select value={selectedClassId} onValueChange={handleClassSelect}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a Class" />
                        </SelectTrigger>
                        <SelectContent>
                            {classes.map(c => (
                                <SelectItem key={c.id} value={c.id}>{c.name} {c.section ? `(${c.section})` : ''}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                {selectedClassId && (
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setShowConfig(true)}>
                            <Settings className="mr-2 h-4 w-4" /> Reset Grid Config
                        </Button>
                        <Button variant="outline" onClick={() => window.print()}>
                            <Printer className="mr-2 h-4 w-4" /> Print
                        </Button>
                        {gridTemplate.length > 0 && (
                            <Button variant="outline" className="border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100" onClick={() => setShowAutoFillPanel(!showAutoFillPanel)}>
                                <Wand2 className="mr-2 h-4 w-4" /> {showAutoFillPanel ? 'Hide Auto-Fill' : 'Auto-Fill Engine'}
                            </Button>
                        )}
                        <Button disabled={isPending || gridTemplate.length === 0} onClick={commitBulkSave}>
                            {isPending ? 'Saving...' : <><Save className="mr-2 h-4 w-4" /> Save Timetable</>}
                        </Button>
                    </div>
                )}
            </div>

            {selectedClassId && showConfig && (
                <div className="bg-card text-card-foreground p-6 rounded-xl border border-border shadow-sm max-w-3xl mx-auto space-y-6">
                    <div>
                        <h3 className="text-xl font-bold flex items-center"><Clock className="mr-2" /> Timetable Auto-Generator</h3>
                        <p className="text-sm text-muted-foreground mt-1">Configure your daily block intervals natively mitigating manual timestamping. The resulting matrix allows 1-click drag additions.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">School Start Time</label>
                            <Input type="time" value={startTimeRaw} onChange={e => setStartTimeRaw(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Lectures Per Day</label>
                            <Input type="number" min="1" max="12" value={lecturesPerDay} onChange={e => setLecturesPerDay(Number(e.target.value))} required />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Lecture Duration (Mins)</label>
                            <Input type="number" min="15" value={lectureDuration} onChange={e => setLectureDuration(Number(e.target.value))} required />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Break Between Lectures (Mins)</label>
                            <Input type="number" min="0" value={breakDuration} onChange={e => setBreakDuration(Number(e.target.value))} required />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Lunch Break Duration (Mins)</label>
                            <Input type="number" min="0" value={lunchDuration} onChange={e => setLunchDuration(Number(e.target.value))} required />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Lunch Break Happens After... (Lecture No.)</label>
                            <Select value={lunchAfterLecture.toString()} onValueChange={v => setLunchAfterLecture(Number(v))}>
                                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                <SelectContent>
                                    {Array.from({ length: lecturesPerDay - 1 }).map((_, i) => (
                                        <SelectItem key={i} value={(i + 1).toString()}>Lecture {i + 1}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <Button onClick={generateGrid} className="w-full" size="lg">Generate Empty Timetable Matrix</Button>
                </div>
            )}

            {selectedClassId && !showConfig && gridTemplate.length > 0 && showAutoFillPanel && (
                <div className="bg-white border-2 border-indigo-100 p-6 rounded-xl shadow-sm max-w-4xl mx-auto print:hidden">
                    <h3 className="text-xl font-bold flex items-center text-indigo-800 mb-4"><Wand2 className="mr-2" /> Auto-Fill Configuration</h3>
                    <div className="flex justify-between items-center mb-6">
                        <p className="text-sm text-slate-500 max-w-md">Add the subjects, their respective teachers, and weekly frequency. The engine will smartly distribute them across the active days.</p>
                        <div className="bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-lg flex flex-col items-end">
                            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Weekly Slot Usage</span>
                            <div className="text-lg font-black text-indigo-700">
                                {allocations.reduce((sum, a) => sum + a.frequency, 0)} / {ACTIVE_DAYS_DEFAULT.length * gridTemplate.filter(s => s.type === 'Lecture').length}
                                <span className="text-xs font-normal text-indigo-400 ml-1">Allocated</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6 flex items-end gap-3 flex-wrap">
                        <div className="flex-1 min-w-[200px] space-y-1">
                            <label className="text-xs font-bold text-slate-600">Subject Name</label>
                            <Input placeholder="E.g. Mathematics" value={newAllocSubject} onChange={e => setNewAllocSubject(e.target.value)} />
                        </div>
                        <div className="flex-1 min-w-[200px] space-y-1">
                            <label className="text-xs font-bold text-slate-600">Teacher</label>
                            <Select value={newAllocTeacher} onValueChange={setNewAllocTeacher}>
                                <SelectTrigger className="bg-white"><SelectValue placeholder="Select" /></SelectTrigger>
                                <SelectContent>
                                    {teachers.map(t => <SelectItem key={t.id} value={t.id}>{t.firstName} {t.lastName}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="w-24 space-y-1">
                            <label className="text-xs font-bold text-slate-600">Classes/Wk</label>
                            <Input type="number" min="1" max="10" value={newAllocFreq} onChange={e => setNewAllocFreq(Number(e.target.value))} />
                        </div>
                        <Button onClick={() => {
                            if (!newAllocSubject || !newAllocTeacher) return alert('Subject and Teacher required.');
                            setAllocations([...allocations, { id: Math.random().toString(36).substring(7), subject: newAllocSubject, teacherId: newAllocTeacher, frequency: newAllocFreq }]);
                            setNewAllocSubject('');
                            setNewAllocTeacher('');
                            setNewAllocFreq(1);
                        }}>
                            <Plus className="w-4 h-4 mr-1" /> Add
                        </Button>
                    </div>

                    {allocations.length > 0 && (
                        <div className="space-y-2 mb-6">
                            <h4 className="text-sm font-bold text-slate-700">Subject Allocations Queue</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                {allocations.map(a => (
                                    <div key={a.id} className="bg-white p-3 border border-slate-200 rounded flex justify-between items-center shadow-sm">
                                        <div>
                                            <div className="font-bold text-sm text-indigo-700">{a.subject} <span className="text-xs text-slate-400 font-normal">({a.frequency}/wk)</span></div>
                                            <div className="text-xs text-slate-500 mt-0.5">{teachers.find(t => t.id === a.teacherId)?.firstName}</div>
                                        </div>
                                        <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-700 hover:bg-red-50" onClick={() => setAllocations(allocations.filter(x => x.id !== a.id))}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end pt-4 border-t border-indigo-50">
                        <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-md" onClick={runAutoFill} disabled={allocations.length === 0}>
                            Run Auto-Fill Engine
                        </Button>
                    </div>
                </div>
            )}

            {selectedClassId && !showConfig && gridTemplate.length > 0 && (
                <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm overflow-x-auto print:overflow-visible">
                    <div className="p-4 bg-muted/50 border-b border-border text-center font-bold text-2xl">
                        Class Timetable: {classes.find(c => c.id === selectedClassId)?.name}
                    </div>

                    <div className="min-w-[800px]">
                        {/* HEADER ROW */}
                        <div className="flex border-b border-border bg-muted/30">
                            <div className="w-32 p-4 font-bold border-r border-border flex-shrink-0">Day</div>
                            {gridTemplate.map(slot => (
                                <div key={slot.id} className={`p-2 border-r border-border text-center flex-1 min-w-[120px] max-w-[200px] flex flex-col justify-center ${slot.type !== 'Lecture' ? 'bg-muted/50 text-muted-foreground' : ''}`}>
                                    <div className="text-xs font-semibold">{slot.type === 'Lecture' ? 'Slot' : slot.type}</div>
                                    <div className="text-[10px] opacity-70">{slot.startTime} - {slot.endTime}</div>
                                </div>
                            ))}
                        </div>

                        {/* DAY ROWS */}
                        {ACTIVE_DAYS_DEFAULT.map(dayIdx => (
                            <div key={dayIdx} className="flex border-b border-border last:border-0 hover:bg-muted/10 transition-colors">
                                <div className="w-32 p-4 font-bold border-r border-border flex items-center flex-shrink-0">{DAYS[dayIdx]}</div>
                                {gridTemplate.map(slot => {
                                    if (slot.type !== 'Lecture') {
                                        return <div key={slot.id} className="p-2 border-r border-border text-center flex-1 min-w-[120px] max-w-[200px] bg-muted/50 flex items-center justify-center">
                                            <span className="text-muted-foreground text-xs uppercase font-semibold tracking-wider">{slot.type}</span>
                                        </div>;
                                    }

                                    const cellData = matrixPayload[dayIdx]?.[slot.id];
                                    const isActive = !!cellData?.subject;

                                    return (
                                        <div
                                            key={slot.id}
                                            onClick={() => {
                                                setEditSubject(cellData?.subject || '');
                                                setEditTeacher(cellData?.teacherId || '');
                                                setEditingCell({ dayIdx, slotId: slot.id });
                                            }}
                                            className={`p-2 border-r border-border text-center flex-1 min-w-[120px] max-w-[200px] cursor-pointer print:break-inside-avoid relative group transition-all duration-200 ${isActive ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-accent'}`}
                                        >
                                            {isActive ? (
                                                <div className="flex flex-col h-full items-center justify-center">
                                                    <div className="font-bold text-sm text-primary mb-1">{cellData.subject}</div>
                                                    <div className="text-xs text-muted-foreground line-clamp-1">{teachers.find(t => t.id === cellData.teacherId)?.firstName}</div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-center h-full opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <span className="text-xs font-semibold text-muted-foreground">+ Assign</span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Editing Dialog Modal */}
            <Dialog open={editingCell !== null} onOpenChange={(open) => !open && setEditingCell(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Assign Class Slot</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Subject Name</label>
                            <Input placeholder="E.g. Biology" value={editSubject} onChange={(e) => setEditSubject(e.target.value)} />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Teacher</label>
                            <Select value={editTeacher} onValueChange={setEditTeacher}>
                                <SelectTrigger><SelectValue placeholder="Select Teacher" /></SelectTrigger>
                                <SelectContent>
                                    {teachers.map(t => (
                                        <SelectItem key={t.id} value={t.id}>{t.firstName} {t.lastName}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex justify-between pt-4">
                            <Button variant="destructive" onClick={() => {
                                setEditSubject('');
                                setEditTeacher('');
                                applyCellEdit();
                            }}>Clear Slot</Button>
                            <Button onClick={applyCellEdit}><CheckCircle className="w-4 h-4 mr-2" /> Apply Assignment</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

        </div>
    );
}
