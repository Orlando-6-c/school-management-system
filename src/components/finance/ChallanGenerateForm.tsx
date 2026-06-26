'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { generateChallansByFilter } from '@/actions/finance';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

interface Props {
    classes: { id: string; name: string; section: string | null }[];
}

export default function ChallanGenerateForm({ classes }: Props) {
    const router = useRouter();
    const now = new Date();
    const [month, setMonth] = useState(MONTHS[now.getMonth()]);
    const [year, setYear] = useState(now.getFullYear().toString());
    const [classId, setClassId] = useState('all');
    const [dueDate, setDueDate] = useState(() => {
        const d = new Date(now.getFullYear(), now.getMonth() + 1, 10);
        return d.toISOString().split('T')[0];
    });
    const [result, setResult] = useState<{ success: boolean; message: string; generated?: number; skipped?: number } | null>(null);
    const [isPending, startTransition] = useTransition();

    const years = Array.from({ length: 5 }, (_, i) => (now.getFullYear() - 1 + i).toString());

    function handleGenerate() {
        setResult(null);
        startTransition(async () => {
            const res = await generateChallansByFilter(
                classId === 'all' ? undefined : classId,
                undefined,
                month,
                parseInt(year),
                new Date(dueDate)
            );
            if (res.success) {
                const generated = (res as any).generatedChallans?.length ?? 0;
                setResult({ success: true, message: res.message || 'Done.', generated });
            } else {
                setResult({ success: false, message: res.message || 'Failed.' });
            }
        });
    }

    return (
        <div className="max-w-lg space-y-6">
            <div className="bg-card border border-border rounded-lg p-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label>Month</Label>
                        <Select value={month} onValueChange={setMonth}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <Label>Year</Label>
                        <Select value={year} onValueChange={setYear}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <Label>Class (optional — leave blank to generate for all classes)</Label>
                    <Select value={classId} onValueChange={setClassId}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Classes</SelectItem>
                            {classes.map(c => (
                                <SelectItem key={c.id} value={c.id}>
                                    {c.name}{c.section ? ` (${c.section})` : ''}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1.5">
                    <Label>Due Date</Label>
                    <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                    <p className="text-xs text-muted-foreground">Challans already existing for this month/year are skipped automatically.</p>
                </div>

                {result && (
                    <div className={`rounded-lg px-4 py-3 text-sm ${result.success ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300' : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300'}`}>
                        {result.message}
                        {result.success && typeof result.generated === 'number' && (
                            <span className="ml-1 font-medium">{result.generated} challan{result.generated !== 1 ? 's' : ''} created.</span>
                        )}
                    </div>
                )}

                <div className="flex gap-3 pt-1">
                    <Button onClick={handleGenerate} disabled={isPending || !month || !year || !dueDate}>
                        {isPending ? 'Generating…' : `Generate Challans — ${month} ${year}`}
                    </Button>
                    {result?.success && (
                        <Button variant="outline" onClick={() => router.push('/school/finance/challan')}>
                            View Challans
                        </Button>
                    )}
                </div>
            </div>

            <div className="bg-muted/40 border border-border rounded-lg px-4 py-3 text-sm text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">How challan generation works</p>
                <ul className="list-disc list-inside space-y-0.5">
                    <li>Only active students with a monthly fee configured are included.</li>
                    <li>Students who already have a non-cancelled challan for this month are skipped.</li>
                    <li>Each challan total includes the student&apos;s monthly fee, any applicable additional charges, minus any discount.</li>
                    <li>Marking a challan as Paid automatically creates an income record.</li>
                </ul>
            </div>
        </div>
    );
}
