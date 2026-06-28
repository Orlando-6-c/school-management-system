'use client';

import { useState, useRef } from 'react';
import { importStaff, type StaffImportRow, type ImportResult } from '@/actions/import';
import { Upload, Download, CheckCircle2, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import Link from 'next/link';

const TEMPLATE_HEADERS = [
    'name', 'fatherName', 'cnic', 'dateOfBirth', 'contact',
    'gender', 'role', 'workingHours', 'salary',
];
const TEMPLATE_EXAMPLE = [
    'Muhammad Ali', 'Haji Muhammad', '35202-1234567-8', '1990-05-15', '03001234567',
    'Male', 'Peon', '8 AM - 4 PM', '15000',
];

const COLUMNS: { name: string; required: boolean; format: string; example: string }[] = [
    { name: 'name',         required: true, format: 'Full name',                       example: 'Muhammad Ali' },
    { name: 'fatherName',   required: true, format: "Father's full name",              example: 'Haji Muhammad' },
    { name: 'cnic',         required: true, format: 'Must be unique per school',       example: '35202-1234567-8' },
    { name: 'dateOfBirth',  required: true, format: 'YYYY-MM-DD',                     example: '1990-05-15' },
    { name: 'contact',      required: true, format: 'Min 10 digits',                  example: '03001234567' },
    { name: 'gender',       required: true, format: '"Male" or "Female"',             example: 'Male' },
    { name: 'role',         required: true, format: 'Job title / designation',        example: 'Peon / Driver / Guard / Cook' },
    { name: 'workingHours', required: true, format: 'Daily schedule',                 example: '8 AM - 4 PM' },
    { name: 'salary',       required: true, format: 'Monthly PKR (number)',           example: '15000' },
];

function downloadTemplate() {
    const csv = [TEMPLATE_HEADERS, TEMPLATE_EXAMPLE].map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'staff-import-template.csv';
    a.click();
    URL.revokeObjectURL(a.href);
}

function parseCSV(text: string): string[][] {
    const lines = text.trim().split('\n');
    return lines.map((line) => {
        const cols: string[] = [];
        let cur = '';
        let inQ = false;
        for (let i = 0; i < line.length; i++) {
            const c = line[i];
            if (c === '"') { inQ = !inQ; continue; }
            if (c === ',' && !inQ) { cols.push(cur.trim()); cur = ''; continue; }
            cur += c;
        }
        cols.push(cur.trim());
        return cols;
    });
}

type Phase = 'upload' | 'preview' | 'result';

export function StaffImportClient() {
    const fileRef = useRef<HTMLInputElement>(null);
    const [phase, setPhase] = useState<Phase>('upload');
    const [rows, setRows] = useState<StaffImportRow[]>([]);
    const [result, setResult] = useState<ImportResult | null>(null);
    const [importing, setImporting] = useState(false);
    const [parseError, setParseError] = useState('');

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const text = ev.target?.result as string;
            try {
                const parsed = parseCSV(text);
                if (parsed.length < 2) { setParseError('CSV must have at least one data row.'); return; }
                const headers = parsed[0].map((h) => h.toLowerCase().trim());
                const expectedHeaders = TEMPLATE_HEADERS.map((h) => h.toLowerCase());
                const missing = expectedHeaders.filter((h) => !headers.includes(h));
                if (missing.length) { setParseError(`Missing columns: ${missing.join(', ')}`); return; }

                const data = parsed.slice(1).filter((r) => r.some((c) => c)).map((r, i) => {
                    const obj: Record<string, string> = {};
                    headers.forEach((h, idx) => {
                        const canonIdx = expectedHeaders.indexOf(h);
                        obj[canonIdx >= 0 ? TEMPLATE_HEADERS[canonIdx] : h] = r[idx] ?? '';
                    });
                    return { row: i + 2, ...obj } as StaffImportRow;
                });
                setRows(data);
                setParseError('');
                setPhase('preview');
            } catch {
                setParseError('Failed to parse CSV. Ensure it matches the template format.');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const handleImport = async () => {
        setImporting(true);
        const res = await importStaff(rows);
        setResult(res);
        setPhase('result');
        setImporting(false);
    };

    return (
        <div className="space-y-6 max-w-5xl">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Import Staff</h1>
                    <p className="text-muted-foreground mt-1">Bulk-add non-teaching staff from a CSV file.</p>
                </div>
                <Link href="/school/staff" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    ← Back to staff
                </Link>
            </div>

            {/* Step indicators */}
            <div className="flex items-center gap-2 text-sm">
                {(['upload', 'preview', 'result'] as Phase[]).map((p, i) => (
                    <span key={p} className="flex items-center gap-2">
                        {i > 0 && <span className="text-border">›</span>}
                        <span className={`font-medium ${phase === p ? 'text-primary' : 'text-muted-foreground'}`}>
                            {i + 1}. {p.charAt(0).toUpperCase() + p.slice(1)}
                        </span>
                    </span>
                ))}
            </div>

            {/* Upload phase */}
            {phase === 'upload' && (
                <div className="bg-card rounded-2xl border border-border shadow-sm p-8 space-y-6">
                    <div className="space-y-2">
                        <h2 className="font-semibold text-foreground">Step 1: Prepare your CSV</h2>
                        <p className="text-sm text-muted-foreground">
                            Download the template, fill in staff data, then upload it here.
                        </p>
                        <button
                            onClick={downloadTemplate}
                            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                        >
                            <Download className="h-4 w-4" /> Download template CSV
                        </button>
                    </div>

                    {/* Column reference */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-foreground">CSV column reference</h3>
                        <div className="overflow-x-auto rounded-xl border border-border">
                            <table className="w-full text-xs">
                                <thead className="bg-muted border-b border-border">
                                    <tr>
                                        <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground">Column</th>
                                        <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground">Required</th>
                                        <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground">Format / Notes</th>
                                        <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground">Example</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {COLUMNS.map((col) => (
                                        <tr key={col.name} className="hover:bg-muted/30">
                                            <td className="px-4 py-2 font-mono font-semibold text-foreground">{col.name}</td>
                                            <td className="px-4 py-2">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${col.required ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>
                                                    {col.required ? 'Required' : 'Optional'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2 text-muted-foreground">{col.format}</td>
                                            <td className="px-4 py-2 font-mono text-foreground">{col.example}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div
                        onClick={() => fileRef.current?.click()}
                        className="border-2 border-dashed border-border rounded-2xl p-12 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all"
                    >
                        <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                        <p className="font-semibold text-foreground">Click to upload CSV</p>
                        <p className="text-sm text-muted-foreground mt-1">CSV files only · UTF-8 encoding</p>
                        <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={handleFile} className="hidden" />
                    </div>

                    {parseError && (
                        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                            {parseError}
                        </div>
                    )}
                </div>
            )}

            {/* Preview phase */}
            {phase === 'preview' && (
                <div className="space-y-4">
                    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                            <div>
                                <h2 className="font-semibold text-foreground">Step 2: Review {rows.length} rows</h2>
                                <p className="text-sm text-muted-foreground mt-0.5">Check the data before importing.</p>
                            </div>
                            <button onClick={() => setPhase('upload')} className="text-sm text-muted-foreground hover:text-foreground">
                                ← Re-upload
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-muted border-b border-border">
                                    <tr>
                                        <th className="px-3 py-2 font-semibold text-muted-foreground">#</th>
                                        <th className="px-3 py-2 font-semibold text-muted-foreground">Name</th>
                                        <th className="px-3 py-2 font-semibold text-muted-foreground">Father</th>
                                        <th className="px-3 py-2 font-semibold text-muted-foreground">CNIC</th>
                                        <th className="px-3 py-2 font-semibold text-muted-foreground">DOB</th>
                                        <th className="px-3 py-2 font-semibold text-muted-foreground">Contact</th>
                                        <th className="px-3 py-2 font-semibold text-muted-foreground">Gender</th>
                                        <th className="px-3 py-2 font-semibold text-muted-foreground">Role</th>
                                        <th className="px-3 py-2 font-semibold text-muted-foreground">Hours</th>
                                        <th className="px-3 py-2 font-semibold text-muted-foreground">Salary</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {rows.slice(0, 50).map((r) => (
                                        <tr key={r.row} className="hover:bg-muted/30">
                                            <td className="px-3 py-2 text-muted-foreground">{r.row}</td>
                                            <td className="px-3 py-2 font-medium text-foreground">{r.name}</td>
                                            <td className="px-3 py-2 text-muted-foreground">{r.fatherName}</td>
                                            <td className="px-3 py-2 text-muted-foreground font-mono">{r.cnic}</td>
                                            <td className="px-3 py-2 text-muted-foreground">{r.dateOfBirth}</td>
                                            <td className="px-3 py-2 text-muted-foreground">{r.contact}</td>
                                            <td className="px-3 py-2 text-muted-foreground">{r.gender}</td>
                                            <td className="px-3 py-2 text-muted-foreground">{r.role}</td>
                                            <td className="px-3 py-2 text-muted-foreground">{r.workingHours}</td>
                                            <td className="px-3 py-2 text-muted-foreground">Rs {r.salary}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {rows.length > 50 && (
                                <p className="text-xs text-muted-foreground px-4 py-2 border-t border-border">
                                    Showing first 50 of {rows.length} rows.
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3">
                        <button onClick={() => setPhase('upload')} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg">
                            Cancel
                        </button>
                        <button
                            onClick={handleImport}
                            disabled={importing}
                            className="inline-flex items-center gap-2 px-6 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                        >
                            {importing ? <><Loader2 className="h-4 w-4 animate-spin" /> Importing…</> : `Import ${rows.length} staff members`}
                        </button>
                    </div>
                </div>
            )}

            {/* Result phase */}
            {phase === 'result' && result && (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 flex items-center gap-3">
                            <CheckCircle2 className="h-8 w-8 text-emerald-600 shrink-0" />
                            <div>
                                <p className="text-2xl font-bold text-emerald-700">{result.succeeded}</p>
                                <p className="text-sm text-emerald-600">Staff members imported</p>
                            </div>
                        </div>
                        <div className={`${result.failed.length > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'} border rounded-xl p-5 flex items-center gap-3`}>
                            <XCircle className={`h-8 w-8 shrink-0 ${result.failed.length > 0 ? 'text-red-500' : 'text-gray-400'}`} />
                            <div>
                                <p className={`text-2xl font-bold ${result.failed.length > 0 ? 'text-red-600' : 'text-gray-500'}`}>{result.failed.length}</p>
                                <p className={`text-sm ${result.failed.length > 0 ? 'text-red-500' : 'text-gray-400'}`}>Failed rows</p>
                            </div>
                        </div>
                    </div>

                    {result.failed.length > 0 && (
                        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                            <div className="px-4 py-3 border-b border-border bg-red-50">
                                <h3 className="font-semibold text-red-700 text-sm">Failed rows — fix and re-import</h3>
                            </div>
                            <table className="w-full text-xs">
                                <thead className="bg-muted border-b border-border">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-muted-foreground">Row</th>
                                        <th className="px-4 py-2 text-left text-muted-foreground">Name</th>
                                        <th className="px-4 py-2 text-left text-muted-foreground">Reason</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {result.failed.map((f) => (
                                        <tr key={f.row}>
                                            <td className="px-4 py-2 text-muted-foreground">{f.row}</td>
                                            <td className="px-4 py-2 font-medium text-foreground">{f.name}</td>
                                            <td className="px-4 py-2 text-red-600">{f.reason}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <Link href="/school/staff" className="px-5 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                            View staff
                        </Link>
                        <button onClick={() => { setPhase('upload'); setResult(null); setRows([]); }} className="px-4 py-2 text-sm border border-border rounded-lg text-muted-foreground hover:text-foreground">
                            Import more
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
