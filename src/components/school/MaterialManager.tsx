'use client';

import { useActionState, useEffect } from 'react';
import { uploadMaterial, deleteMaterial } from '@/actions/teacher-dashboard';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, Link as LinkIcon, Download } from 'lucide-react';
import Link from 'next/link';

export default function MaterialManager({ assignments, materials }: { assignments: any[], materials: any[] }) {
    const [state, formAction, isPending] = useActionState(uploadMaterial, { success: false, message: '' });

    useEffect(() => {
        if (state.success) alert("Material Uploaded!");
        else if (state.message) alert(state.message);
    }, [state]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-foreground">
            <div className="lg:col-span-1">
                <form action={formAction} className="bg-white p-6 rounded-xl border border-border mt-0 shadow-sm space-y-4 sticky top-6">
                    <h3 className="text-lg font-semibold text-foreground">Upload Material</h3>

                    <div className="space-y-2">
                        <Label>Target Class</Label>
                        <Select name="classId" required>
                            <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">-- All My Classes --</SelectItem>
                                {assignments.map(a => (
                                    <SelectItem key={a.classId} value={a.classId}>{a.class.name} {a.class.section ? `(${a.class.section})` : ''}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Subject</Label>
                        <Select name="subject" required>
                            <SelectTrigger><SelectValue placeholder="Select Subject" /></SelectTrigger>
                            <SelectContent>
                                {assignments.map((a, i) => (
                                    <SelectItem key={`${a.classId}-${a.subject}-${i}`} value={a.subject}>{a.subject}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Material Title</Label>
                        <Input name="title" placeholder="e.g. Physics Chapter 3 PDF" required />
                    </div>

                    <div className="space-y-2">
                        <Label>File Link or Google Drive URL</Label>
                        <Input name="fileUrl" type="url" placeholder="https://..." required />
                        <p className="text-xs text-muted-foreground mt-1">Direct link to hosted E-Book, PDF, or video resource.</p>
                    </div>

                    <Button type="submit" disabled={isPending} className="w-full">
                        {isPending ? 'Uploading...' : 'Upload Material'}
                    </Button>
                </form>
            </div>

            <div className="lg:col-span-2">
                <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden text-foreground">
                    <div className="divide-y divide-border">
                        {materials.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground">No materials uploaded yet.</div>
                        ) : materials.map(m => (
                            <div key={m.id} className="p-5 flex items-start gap-4 hover:bg-muted/30 transition-colors">
                                <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600 shrink-0">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-base font-bold text-foreground truncate">{m.title}</h4>
                                    <div className="flex gap-2 text-sm mt-1 items-center flex-wrap">
                                        <span className="font-semibold text-indigo-700">{m.subject}</span>
                                        <span className="text-muted-foreground">&bull;</span>
                                        <span className="text-muted-foreground">{m.classId ? m.class?.name : 'All Classes'}</span>
                                    </div>
                                    <div className="mt-3 flex gap-3">
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={m.fileUrl} target="_blank"><Download className="w-4 h-4 mr-2" /> Open / Download Link</Link>
                                        </Button>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={async () => {
                                    if (confirm('Delete this material?')) await deleteMaterial(m.id);
                                }}>
                                    &times; Delete
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
