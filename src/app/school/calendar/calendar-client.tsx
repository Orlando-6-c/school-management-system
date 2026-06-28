'use client';

import { useState, useActionState, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createEvent, updateEvent, deleteEvent } from '@/actions/events';
import { ChevronLeft, ChevronRight, Plus, X, Trash2, Edit2 } from 'lucide-react';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type CalEvent = {
    id: string;
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    isAllDay: boolean;
    color: string;
};

interface CalendarClientProps {
    year: number;
    month: number;
    events: CalEvent[];
    canManage: boolean;
}

const COLOR_OPTIONS = [
    { value: '#7c3aed', label: 'Violet' },
    { value: '#2563eb', label: 'Blue' },
    { value: '#16a34a', label: 'Green' },
    { value: '#d97706', label: 'Amber' },
    { value: '#dc2626', label: 'Red' },
    { value: '#0891b2', label: 'Cyan' },
];

function toLocalDateStr(iso: string) {
    return iso.slice(0, 10);
}

function EventForm({
    editing,
    onClose,
}: {
    editing: CalEvent | null;
    onClose: () => void;
}) {
    const createAction = async (prev: any, fd: FormData) => createEvent(prev, fd);
    const updateAction = editing
        ? async (prev: any, fd: FormData) => updateEvent(editing.id, prev, fd)
        : null;

    const [createState, createFormAction, createPending] = useActionState(createAction, undefined);
    const [updateState, updateFormAction, updatePending] = useActionState(updateAction!, undefined);

    const state = editing ? updateState : createState;
    const formAction = editing ? updateFormAction : createFormAction;
    const pending = editing ? updatePending : createPending;

    if (state?.success) {
        onClose();
        return null;
    }

    const defaultStart = editing ? toLocalDateStr(editing.startDate) : new Date().toISOString().slice(0, 10);
    const defaultEnd = editing ? toLocalDateStr(editing.endDate) : defaultStart;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="font-bold text-lg text-foreground">{editing ? 'Edit Event' : 'New Event'}</h2>
                    <button onClick={onClose} className="p-1 rounded hover:bg-muted"><X className="h-4 w-4" /></button>
                </div>

                {state?.message && (
                    <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{state.message}</p>
                )}

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        startTransition(() => formAction(new FormData(e.currentTarget)));
                    }}
                    className="space-y-3"
                >
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Title</label>
                        <input
                            name="title"
                            defaultValue={editing?.title}
                            required
                            placeholder="Event title"
                            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                        {state?.errors?.title && <p className="text-xs text-red-500 mt-1">{state.errors.title[0]}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Description (optional)</label>
                        <textarea
                            name="description"
                            defaultValue={editing?.description}
                            rows={2}
                            placeholder="Optional details…"
                            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Start date</label>
                            <input
                                name="startDate"
                                type="date"
                                defaultValue={defaultStart}
                                required
                                className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">End date</label>
                            <input
                                name="endDate"
                                type="date"
                                defaultValue={defaultEnd}
                                required
                                className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                            {state?.errors?.endDate && <p className="text-xs text-red-500 mt-1">{state.errors.endDate[0]}</p>}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">Color</label>
                        <div className="flex gap-2 flex-wrap">
                            {COLOR_OPTIONS.map((c) => (
                                <label key={c.value} className="cursor-pointer">
                                    <input type="radio" name="color" value={c.value} defaultChecked={editing ? editing.color === c.value : c.value === '#7c3aed'} className="sr-only peer" />
                                    <span
                                        className="block w-6 h-6 rounded-full ring-2 ring-transparent peer-checked:ring-offset-2 peer-checked:ring-offset-card peer-checked:ring-current transition-all"
                                        style={{ backgroundColor: c.value, color: c.value }}
                                        title={c.label}
                                    />
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={pending}
                            className="px-5 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                        >
                            {pending ? 'Saving…' : editing ? 'Save changes' : 'Create event'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export function CalendarClient({ year, month, events, canManage }: CalendarClientProps) {
    const router = useRouter();
    const [showForm, setShowForm] = useState(false);
    const [editingEvent, setEditingEvent] = useState<CalEvent | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<CalEvent | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    const firstDay = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();

    const navigate = (dir: -1 | 1) => {
        let m = month + dir;
        let y = year;
        if (m < 1) { m = 12; y--; }
        if (m > 12) { m = 1; y++; }
        router.push(`/school/calendar?year=${y}&month=${m}`);
    };

    const eventsOnDay = (day: number) => {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return events.filter((e) => toLocalDateStr(e.startDate) <= dateStr && toLocalDateStr(e.endDate) >= dateStr);
    };

    const handleDelete = async (id: string) => {
        await deleteEvent(id);
        setDeleteConfirm(null);
        setSelectedEvent(null);
        router.refresh();
    };

    const cells: { key: string; empty: boolean; day?: number }[] = [
        ...Array.from({ length: firstDay }, (_, i) => ({ key: `pre-${i}`, empty: true })),
        ...Array.from({ length: daysInMonth }, (_, i) => ({ key: String(i + 1), day: i + 1, empty: false })),
    ];

    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-foreground">Calendar</h1>
                {canManage && (
                    <button
                        onClick={() => { setEditingEvent(null); setShowForm(true); }}
                        className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-semibold px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        <Plus className="h-4 w-4" /> Add Event
                    </button>
                )}
            </div>

            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                {/* Month header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-muted transition-colors">
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <h2 className="text-lg font-bold text-foreground">{MONTHS[month - 1]} {year}</h2>
                    <button onClick={() => navigate(1)} className="p-2 rounded-lg hover:bg-muted transition-colors">
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>

                {/* Day headers */}
                <div className="grid grid-cols-7 border-b border-border">
                    {DAYS_SHORT.map((d) => (
                        <div key={d} className="px-2 py-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            {d}
                        </div>
                    ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7">
                    {cells.map((cell) => {
                        if (cell.empty) {
                            return <div key={cell.key} className="h-24 border-b border-r border-border bg-muted/20" />;
                        }
                        const day = cell.day!;
                        const dayEvents = eventsOnDay(day);
                        const isToday = isCurrentMonth && today.getDate() === day;

                        return (
                            <div
                                key={cell.key}
                                className="h-24 border-b border-r border-border p-1.5 hover:bg-muted/30 transition-colors overflow-hidden"
                            >
                                <div className={`text-xs font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-primary text-primary-foreground' : 'text-foreground'}`}>
                                    {day}
                                </div>
                                <div className="space-y-0.5">
                                    {dayEvents.slice(0, 2).map((e) => (
                                        <button
                                            key={e.id}
                                            onClick={() => setSelectedEvent(e)}
                                            className="w-full text-left text-xs px-1.5 py-0.5 rounded truncate font-medium text-white transition-opacity hover:opacity-80"
                                            style={{ backgroundColor: e.color }}
                                        >
                                            {e.title}
                                        </button>
                                    ))}
                                    {dayEvents.length > 2 && (
                                        <span className="text-[10px] text-muted-foreground px-1">+{dayEvents.length - 2} more</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Upcoming events sidebar strip */}
            {events.length > 0 && (
                <div className="bg-card rounded-xl border border-border shadow-sm p-4">
                    <h3 className="text-sm font-semibold text-foreground mb-3">Events this month</h3>
                    <div className="space-y-2">
                        {events.map((e) => (
                            <div key={e.id} className="flex items-start gap-3 group">
                                <div className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: e.color }} />
                                <div className="flex-1 min-w-0">
                                    <button
                                        onClick={() => setSelectedEvent(e)}
                                        className="text-sm font-medium text-foreground hover:underline text-left truncate block w-full"
                                    >
                                        {e.title}
                                    </button>
                                    <p className="text-xs text-muted-foreground">
                                        {new Date(e.startDate).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}
                                        {toLocalDateStr(e.startDate) !== toLocalDateStr(e.endDate) &&
                                            ` – ${new Date(e.endDate).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}`}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Event detail popup */}
            {selectedEvent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedEvent(null)} />
                    <div className="relative bg-card rounded-2xl border border-border shadow-2xl w-full max-w-sm p-6 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full shrink-0 mt-1" style={{ backgroundColor: selectedEvent.color }} />
                                <h3 className="font-bold text-foreground">{selectedEvent.title}</h3>
                            </div>
                            <button onClick={() => setSelectedEvent(null)} className="p-1 rounded hover:bg-muted shrink-0">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {new Date(selectedEvent.startDate).toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            {toLocalDateStr(selectedEvent.startDate) !== toLocalDateStr(selectedEvent.endDate) &&
                                ` – ${new Date(selectedEvent.endDate).toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`}
                        </p>
                        {selectedEvent.description && (
                            <p className="text-sm text-foreground">{selectedEvent.description}</p>
                        )}
                        {canManage && (
                            <div className="flex gap-2 pt-1">
                                <button
                                    onClick={() => { setEditingEvent(selectedEvent); setSelectedEvent(null); setShowForm(true); }}
                                    className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                                >
                                    <Edit2 className="h-3.5 w-3.5" /> Edit
                                </button>
                                <span className="text-border">·</span>
                                {deleteConfirm === selectedEvent.id ? (
                                    <span className="flex items-center gap-2 text-sm">
                                        <span className="text-red-600">Delete?</span>
                                        <button onClick={() => handleDelete(selectedEvent.id)} className="text-red-600 font-semibold hover:underline">Yes</button>
                                        <button onClick={() => setDeleteConfirm(null)} className="text-muted-foreground hover:underline">No</button>
                                    </span>
                                ) : (
                                    <button
                                        onClick={() => setDeleteConfirm(selectedEvent.id)}
                                        className="flex items-center gap-1.5 text-sm font-medium text-red-500 hover:underline"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" /> Delete
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Create/Edit form dialog */}
            {showForm && (
                <EventForm
                    editing={editingEvent}
                    onClose={() => { setShowForm(false); setEditingEvent(null); router.refresh(); }}
                />
            )}
        </div>
    );
}
