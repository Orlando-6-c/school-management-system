'use client';

import { useState, useActionState, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createExam, deleteExam, saveExamResults } from '@/actions/exams';
import { Plus, ClipboardList, Trash2, Save, X, ChevronRight } from 'lucide-react';

type ClassItem = { id: string; name: string; section: string | null };
type ExamItem = { id: string; title: string; date: string; classId: string; className: string; classSection: string | null; resultCount: number };
type ResultRow = { studentId: string; subject: string; marksObtained: number; totalMarks: number; remarks: string | null };
type StudentItem = { id: string; name: string; rollNumber: string };

interface ExamDetailData {
    exam: { id: string; title: string; date: string; class: { name: string; section: string | null } };
    students: StudentItem[];
    results: ResultRow[];
}

interface ExamsClientProps {
    classes: ClassItem[];
    exams: ExamItem[];
    examDetail: ExamDetailData | null;
    selectedClassId: string;
    canManage: boolean;
}

const COMMON_SUBJECTS = ['Urdu', 'English', 'Mathematics', 'Science', 'Social Studies', 'Islamiat', 'Computer', 'Art'];

function CreateExamForm({ classes, onClose }: { classes: ClassItem[]; onClose: () => void }) {
    const [state, formAction, pending] = useActionState(createExam, undefined);
    if (state?.success) { onClose(); return null; }
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative bg-card rounded-2xl border border-border shadow-2xl w-full max-w-sm p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="font-bold text-foreground">New Exam</h2>
                    <button onClick={onClose}><X className="h-4 w-4" /></button>
                </div>
                {state?.message && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{state.message}</p>}
                <form onSubmit={(e) => { e.preventDefault(); startTransition(() => formAction(new FormData(e.currentTarget))); }} className="space-y-3">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Title</label>
                        <input name="title" placeholder="e.g. Mid-Term 2026" required className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Class</label>
                        <select name="classId" required className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
                            <option value="">Select class…</option>
                            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}{c.section ? ` (${c.section})` : ''}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Date</label>
                        <input name="date" type="date" required className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                    <div className="flex justify-end gap-3 pt-1">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
                        <button type="submit" disabled={pending} className="px-5 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50">
                            {pending ? 'Creating…' : 'Create exam'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function ResultsEditor({ examDetail, onClose }: { examDetail: ExamDetailData; onClose: () => void }) {
    const router = useRouter();
    const [subjects, setSubjects] = useState<string[]>(
        [...new Set(examDetail.results.map((r) => r.subject))].length > 0
            ? [...new Set(examDetail.results.map((r) => r.subject))]
            : ['']
    );
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState('');
    const [newSubject, setNewSubject] = useState('');

    // marks[studentId][subject] = { obtained, total }
    const [marks, setMarks] = useState<Record<string, Record<string, { obtained: string; total: string }>>>(() => {
        const m: Record<string, Record<string, { obtained: string; total: string }>> = {};
        examDetail.students.forEach((s) => {
            m[s.id] = {};
            subjects.forEach((subj) => {
                const existing = examDetail.results.find((r) => r.studentId === s.id && r.subject === subj);
                m[s.id][subj] = { obtained: existing ? String(existing.marksObtained) : '', total: existing ? String(existing.totalMarks) : '100' };
            });
        });
        return m;
    });

    const addSubject = (subj: string) => {
        const s = subj.trim();
        if (!s || subjects.includes(s)) return;
        setSubjects((prev) => [...prev, s]);
        setMarks((prev) => {
            const next = { ...prev };
            examDetail.students.forEach((st) => { next[st.id] = { ...(next[st.id] ?? {}), [s]: { obtained: '', total: '100' } }; });
            return next;
        });
        setNewSubject('');
    };

    const setMark = (studentId: string, subject: string, field: 'obtained' | 'total', val: string) => {
        setMarks((prev) => ({
            ...prev,
            [studentId]: { ...(prev[studentId] ?? {}), [subject]: { ...(prev[studentId]?.[subject] ?? { obtained: '', total: '100' }), [field]: val } },
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        const rows: { studentId: string; subject: string; marksObtained: number; totalMarks: number }[] = [];
        examDetail.students.forEach((s) => {
            subjects.forEach((subj) => {
                const m = marks[s.id]?.[subj];
                if (m && m.obtained !== '') {
                    rows.push({ studentId: s.id, subject: subj, marksObtained: parseFloat(m.obtained), totalMarks: parseFloat(m.total) || 100 });
                }
            });
        });
        const res = await saveExamResults(examDetail.exam.id, rows);
        setSaveMsg(res.success ? 'Saved!' : (res.message ?? 'Error'));
        setSaving(false);
        if (res.success) { router.refresh(); setTimeout(() => setSaveMsg(''), 2000); }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="font-bold text-foreground">{examDetail.exam.title}</h2>
                    <p className="text-sm text-muted-foreground">
                        {examDetail.exam.class.name}{examDetail.exam.class.section ? ` (${examDetail.exam.class.section})` : ''} ·{' '}
                        {new Date(examDetail.exam.date).toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                </div>
                <button onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground">← Back</button>
            </div>

            {/* Subject manager */}
            <div className="bg-card rounded-xl border border-border p-4 space-y-2">
                <p className="text-sm font-medium text-foreground">Subjects</p>
                <div className="flex flex-wrap gap-2">
                    {subjects.filter(Boolean).map((s) => (
                        <span key={s} className="px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-xs font-medium">{s}</span>
                    ))}
                    {COMMON_SUBJECTS.filter((s) => !subjects.includes(s)).map((s) => (
                        <button key={s} onClick={() => addSubject(s)} className="px-3 py-1 border border-dashed border-border text-muted-foreground rounded-full text-xs hover:border-primary hover:text-primary transition-colors">
                            + {s}
                        </button>
                    ))}
                    <div className="flex gap-1">
                        <input value={newSubject} onChange={(e) => setNewSubject(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addSubject(newSubject)} placeholder="Custom subject" className="px-2 py-1 border border-border rounded-full text-xs bg-background text-foreground w-32 focus:outline-none focus:ring-1 focus:ring-primary/30" />
                        <button onClick={() => addSubject(newSubject)} className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded-full hover:bg-primary/90">Add</button>
                    </div>
                </div>
            </div>

            {/* Marks table */}
            {subjects.filter(Boolean).length > 0 && (
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted border-b border-border">
                                <tr>
                                    <th className="px-4 py-2 text-left font-semibold text-muted-foreground w-40">Student</th>
                                    {subjects.filter(Boolean).map((s) => (
                                        <th key={s} className="px-2 py-2 text-center font-semibold text-muted-foreground min-w-[110px]" colSpan={2}>{s}</th>
                                    ))}
                                </tr>
                                <tr className="border-b border-border">
                                    <td />
                                    {subjects.filter(Boolean).map((s) => (
                                        <>
                                            <td key={`${s}-obtained`} className="px-2 py-1 text-center text-xs text-muted-foreground">Obtained</td>
                                            <td key={`${s}-total`} className="px-2 py-1 text-center text-xs text-muted-foreground">Total</td>
                                        </>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {examDetail.students.map((st) => (
                                    <tr key={st.id} className="hover:bg-muted/30">
                                        <td className="px-4 py-2">
                                            <div className="font-medium text-foreground text-xs">{st.name}</div>
                                            <div className="text-[10px] text-muted-foreground">{st.rollNumber}</div>
                                        </td>
                                        {subjects.filter(Boolean).map((subj) => (
                                            <>
                                                <td key={`${st.id}-${subj}-obt`} className="px-1 py-1">
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        value={marks[st.id]?.[subj]?.obtained ?? ''}
                                                        onChange={(e) => setMark(st.id, subj, 'obtained', e.target.value)}
                                                        className="w-16 px-1.5 py-1 border border-border rounded text-xs text-center bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
                                                        placeholder="–"
                                                    />
                                                </td>
                                                <td key={`${st.id}-${subj}-tot`} className="px-1 py-1">
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        value={marks[st.id]?.[subj]?.total ?? '100'}
                                                        onChange={(e) => setMark(st.id, subj, 'total', e.target.value)}
                                                        className="w-16 px-1.5 py-1 border border-border rounded text-xs text-center bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
                                                    />
                                                </td>
                                            </>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-end gap-3">
                {saveMsg && <span className={`text-sm ${saveMsg === 'Saved!' ? 'text-emerald-600' : 'text-red-500'}`}>{saveMsg}</span>}
                <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors">
                    <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save results'}
                </button>
            </div>
        </div>
    );
}

export function ExamsClient({ classes, exams, examDetail, selectedClassId, canManage }: ExamsClientProps) {
    const router = useRouter();
    const [showCreate, setShowCreate] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleDelete = async (id: string) => {
        await deleteExam(id);
        setDeletingId(null);
        router.refresh();
    };

    if (examDetail) {
        return (
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-foreground">Exam Results</h1>
                <ResultsEditor examDetail={examDetail} onClose={() => router.push('/school/academics/exams')} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-foreground">Exams</h1>
                {canManage && (
                    <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-semibold px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
                        <Plus className="h-4 w-4" /> New Exam
                    </button>
                )}
            </div>

            {/* Class filter */}
            <div className="flex gap-2 flex-wrap">
                <button
                    onClick={() => router.push('/school/academics/exams')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${!selectedClassId ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:text-foreground'}`}
                >
                    All classes
                </button>
                {classes.map((c) => (
                    <button
                        key={c.id}
                        onClick={() => router.push(`/school/academics/exams?classId=${c.id}`)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selectedClassId === c.id ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:text-foreground'}`}
                    >
                        {c.name}{c.section ? ` (${c.section})` : ''}
                    </button>
                ))}
            </div>

            {/* Exams list */}
            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                {exams.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground">
                        <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        <p>No exams yet. Create one to get started.</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-muted border-b border-border">
                            <tr>
                                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Title</th>
                                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Class</th>
                                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Date</th>
                                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Results</th>
                                <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {exams.map((e) => (
                                <tr key={e.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-4 py-3 font-medium text-foreground">{e.title}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{e.className}{e.classSection ? ` (${e.classSection})` : ''}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{new Date(e.date).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${e.resultCount > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'}`}>
                                            {e.resultCount} entries
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => router.push(`/school/academics/exams?examId=${e.id}`)}
                                                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                                            >
                                                Enter results <ChevronRight className="h-3.5 w-3.5" />
                                            </button>
                                            {canManage && (
                                                deletingId === e.id ? (
                                                    <span className="flex items-center gap-1.5 text-xs">
                                                        <span className="text-red-600">Delete?</span>
                                                        <button onClick={() => handleDelete(e.id)} className="text-red-600 font-semibold hover:underline">Yes</button>
                                                        <button onClick={() => setDeletingId(null)} className="text-muted-foreground hover:underline">No</button>
                                                    </span>
                                                ) : (
                                                    <button onClick={() => setDeletingId(e.id)} className="p-1 text-muted-foreground hover:text-red-500 transition-colors">
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {showCreate && <CreateExamForm classes={classes} onClose={() => { setShowCreate(false); router.refresh(); }} />}
        </div>
    );
}
