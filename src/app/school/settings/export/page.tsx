'use client';

import { Download, Users, GraduationCap, FileText, Briefcase } from 'lucide-react';
import Link from 'next/link';

const EXPORTS = [
    { type: 'students', label: 'Students', desc: 'All active students with guardian info, fees, and class.', icon: GraduationCap, color: 'text-violet-600 bg-violet-50' },
    { type: 'teachers', label: 'Teachers', desc: 'All active teaching staff with qualifications and salary.', icon: Users, color: 'text-emerald-600 bg-emerald-50' },
    { type: 'staff', label: 'Staff', desc: 'All active non-teaching staff.', icon: Briefcase, color: 'text-sky-600 bg-sky-50' },
    { type: 'fees', label: 'Fee Challans', desc: 'All challan records with payment status.', icon: FileText, color: 'text-amber-600 bg-amber-50' },
];

export default function ExportPage() {
    const download = (type: string) => {
        const a = document.createElement('a');
        a.href = `/api/export?type=${type}`;
        a.click();
    };

    return (
        <div className="space-y-6 max-w-3xl">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Data Export</h1>
                    <p className="text-muted-foreground mt-1">Download your school data as CSV files.</p>
                </div>
                <Link href="/school/settings" className="text-sm text-muted-foreground hover:text-foreground">← Settings</Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {EXPORTS.map(({ type, label, desc, icon: Icon, color }) => (
                    <div key={type} className="bg-card border border-border rounded-2xl shadow-sm p-5 flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                                <Icon className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="font-semibold text-foreground">{label}</p>
                                <p className="text-xs text-muted-foreground">.csv</p>
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground flex-1">{desc}</p>
                        <button
                            onClick={() => download(type)}
                            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                        >
                            <Download className="h-4 w-4" /> Download {label} CSV
                        </button>
                    </div>
                ))}
            </div>

            <div className="bg-muted/50 rounded-xl p-4 text-sm text-muted-foreground">
                Exports contain data current at the time of download. Soft-deleted records are excluded.
                For full data backups or GDPR deletion requests, contact support.
            </div>
        </div>
    );
}
