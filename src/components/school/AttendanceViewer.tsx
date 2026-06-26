'use client';

import { useState, useTransition } from 'react';
import { getAttendanceReport, getAttendanceSummary } from '@/actions/attendance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface ClassOption { id: string; name: string; section: string | null; gradeLevel: number }

interface AttendanceViewerProps {
    classes: ClassOption[];
}

type DayRow = { studentId: string; name: string; rollNumber: string; status: string; remarks: string | null };
type SummaryRow = { studentId: string; name: string; rollNumber: string; present: number; absent: number; total: number; pct: number | null };

export function AttendanceViewer({ classes }: AttendanceViewerProps) {
    const today = new Date().toISOString().split('T')[0];

    const [classId, setClassId] = useState('');
    const [date, setDate] = useState(today);
    const [fromDate, setFromDate] = useState(today);
    const [toDate, setToDate] = useState(today);

    const [dayRows, setDayRows] = useState<DayRow[] | null>(null);
    const [dayStats, setDayStats] = useState<{ present: number; absent: number; notMarked: number; total: number } | null>(null);
    const [summaryRows, setSummaryRows] = useState<SummaryRow[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    function handleDayLoad() {
        if (!classId || !date) return;
        setError(null);
        startTransition(async () => {
            const res = await getAttendanceReport(classId, date);
            if (!res.success) { setError(res.message); return; }
            setDayRows(res.rows);
            setDayStats(res.stats);
            setSummaryRows(null);
        });
    }

    function handleSummaryLoad() {
        if (!classId || !fromDate || !toDate) return;
        setError(null);
        startTransition(async () => {
            const res = await getAttendanceSummary(classId, fromDate, toDate);
            if (!res.success) { setError(res.message); return; }
            setSummaryRows(res.rows);
            setDayRows(null);
            setDayStats(null);
        });
    }

    const statusBadge = (status: string) => {
        if (status === 'present') return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Present</Badge>;
        if (status === 'absent') return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Absent</Badge>;
        return <Badge variant="outline" className="text-muted-foreground">Not marked</Badge>;
    };

    return (
        <div className="space-y-6">
            {/* Class selector — shared */}
            <Card className="border-border shadow-sm">
                <CardContent className="pt-4 pb-4">
                    <div className="flex items-end gap-4 flex-wrap">
                        <div className="space-y-1.5 min-w-[220px]">
                            <Label>Class</Label>
                            <Select value={classId} onValueChange={setClassId}>
                                <SelectTrigger><SelectValue placeholder="Select a class" /></SelectTrigger>
                                <SelectContent>
                                    {classes.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>
                                            {c.name}{c.section ? ` (${c.section})` : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Tabs defaultValue="daily">
                <TabsList>
                    <TabsTrigger value="daily">Daily View</TabsTrigger>
                    <TabsTrigger value="summary">Date Range Summary</TabsTrigger>
                </TabsList>

                {/* ── Daily tab ────────────────────────────────────────────── */}
                <TabsContent value="daily" className="space-y-4 pt-2">
                    <div className="flex items-end gap-4 flex-wrap">
                        <div className="space-y-1.5">
                            <Label htmlFor="date">Date</Label>
                            <Input id="date" type="date" value={date} max={today} onChange={(e) => setDate(e.target.value)} className="w-40" />
                        </div>
                        <Button onClick={handleDayLoad} disabled={!classId || isPending}>
                            {isPending ? 'Loading…' : 'View'}
                        </Button>
                    </div>

                    {dayStats && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <StatCard label="Total" value={dayStats.total} />
                            <StatCard label="Present" value={dayStats.present} color="green" />
                            <StatCard label="Absent" value={dayStats.absent} color="red" />
                            <StatCard label="Not Marked" value={dayStats.notMarked} color="gray" />
                        </div>
                    )}

                    {dayRows && (
                        <Card className="border-border shadow-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base">
                                    Attendance — {new Date(date + 'T00:00:00').toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="pl-4">Roll #</TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Remarks</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {dayRows.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                                    No students found in this class.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            dayRows.map((row) => (
                                                <TableRow key={row.studentId} className={cn(row.status === 'absent' && 'bg-red-50/40')}>
                                                    <TableCell className="pl-4 font-mono text-sm">{row.rollNumber}</TableCell>
                                                    <TableCell className="font-medium">{row.name}</TableCell>
                                                    <TableCell>{statusBadge(row.status)}</TableCell>
                                                    <TableCell className="text-muted-foreground text-sm">{row.remarks ?? '—'}</TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* ── Summary tab ──────────────────────────────────────────── */}
                <TabsContent value="summary" className="space-y-4 pt-2">
                    <div className="flex items-end gap-4 flex-wrap">
                        <div className="space-y-1.5">
                            <Label htmlFor="fromDate">From</Label>
                            <Input id="fromDate" type="date" value={fromDate} max={today} onChange={(e) => setFromDate(e.target.value)} className="w-40" />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="toDate">To</Label>
                            <Input id="toDate" type="date" value={toDate} max={today} onChange={(e) => setToDate(e.target.value)} className="w-40" />
                        </div>
                        <Button onClick={handleSummaryLoad} disabled={!classId || isPending}>
                            {isPending ? 'Loading…' : 'View Summary'}
                        </Button>
                    </div>

                    {summaryRows && (
                        <Card className="border-border shadow-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base">Attendance Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="pl-4">Roll #</TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead className="text-center">Present</TableHead>
                                            <TableHead className="text-center">Absent</TableHead>
                                            <TableHead className="text-center">Days</TableHead>
                                            <TableHead className="text-center">%</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {summaryRows.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                                    No data found.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            summaryRows.map((row) => (
                                                <TableRow key={row.studentId}>
                                                    <TableCell className="pl-4 font-mono text-sm">{row.rollNumber}</TableCell>
                                                    <TableCell className="font-medium">{row.name}</TableCell>
                                                    <TableCell className="text-center text-green-700 font-medium">{row.present}</TableCell>
                                                    <TableCell className="text-center text-red-600 font-medium">{row.absent}</TableCell>
                                                    <TableCell className="text-center text-muted-foreground">{row.total}</TableCell>
                                                    <TableCell className="text-center">
                                                        {row.pct === null ? (
                                                            <span className="text-muted-foreground">—</span>
                                                        ) : (
                                                            <span className={cn('font-semibold', row.pct >= 75 ? 'text-green-700' : 'text-red-600')}>
                                                                {row.pct}%
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}

function StatCard({ label, value, color }: { label: string; value: number; color?: 'green' | 'red' | 'gray' }) {
    return (
        <Card className="border-border shadow-sm">
            <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
                <p className={cn(
                    'text-3xl font-bold mt-1',
                    color === 'green' && 'text-green-700',
                    color === 'red' && 'text-red-600',
                    color === 'gray' && 'text-muted-foreground',
                    !color && 'text-foreground',
                )}>
                    {value}
                </p>
            </CardContent>
        </Card>
    );
}
