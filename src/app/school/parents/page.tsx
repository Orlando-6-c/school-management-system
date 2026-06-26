import db from '@/lib/db';
import { getSession } from '@/lib/session';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Phone, Mail } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export const runtime = 'nodejs';

export default async function ParentsPage() {
    const session = await getSession();
    if (!session.schoolId) redirect('/login');

    const parents = await db.guardian.findMany({
        where: { schoolId: session.schoolId },
        include: {
            students: {
                include: { class: true }
            }
        },
        orderBy: { name: 'asc' }
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Parents Directory</h1>
            </div>

            <Card className="bg-card border-border shadow-sm">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-foreground">Registered Guardians</CardTitle>
                            <CardDescription>Accounts authorized via admission linking. Total: {parents.length}</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[200px]">Parent Name</TableHead>
                                <TableHead>Contact Information</TableHead>
                                <TableHead>Account Login Details</TableHead>
                                <TableHead>Linked Children</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {parents.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                                        No parents registered. Admit students to securely instantiate guardians.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                parents.map((parent) => (
                                    <TableRow key={parent.id}>
                                        <TableCell className="font-bold text-slate-800">
                                            {parent.name}
                                            <div className="text-xs text-muted-foreground font-normal mt-1">{parent.relation}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center text-sm text-slate-600">
                                                <Phone className="w-3 h-3 mr-2" /> {parent.contact}
                                            </div>
                                            {parent.email && (
                                                <div className="flex items-center text-sm text-slate-600 mt-1">
                                                    <Mail className="w-3 h-3 mr-2" /> {parent.email}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="bg-slate-50 border border-slate-200 rounded p-3 w-max">
                                                <div className="flex justify-between items-center gap-4">
                                                    <span className="text-xs text-slate-500 uppercase font-bold tracking-widest">Username</span>
                                                    <span className="font-mono text-sm font-black text-indigo-700">{parent.cnic}</span>
                                                </div>
                                                <div className="flex justify-between items-center gap-4 mt-1 border-t border-slate-200 pt-1">
                                                    <span className="text-xs text-slate-500 uppercase font-bold tracking-widest">Password</span>
                                                    <span className="font-mono text-xs text-slate-600">{parent.contact}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {parent.students.length === 0 ? (
                                                <span className="text-muted-foreground text-xs italic">No active bonds</span>
                                            ) : (
                                                <div className="space-y-2">
                                                    {parent.students.map((child: any) => (
                                                        <div key={child.id} className="flex flex-col border-l-2 border-indigo-200 pl-3">
                                                            <div className="text-sm font-bold text-slate-700">{child.name}</div>
                                                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                                                                <span className="text-indigo-600">{child.rollNumber}</span>
                                                                <span>&bull;</span>
                                                                <span>{child.class ? `Class ${child.class.name} ${child.class.section}` : 'Unassigned'}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
