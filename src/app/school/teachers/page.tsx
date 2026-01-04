import Link from 'next/link';
import Image from 'next/image';
import { getSession } from '@/lib/session';
import db from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Printer } from 'lucide-react';

export const runtime = 'nodejs';

export default async function TeachersPage() {
    const session = await getSession();
    if (!session.schoolId) return null; // Or redirect

    const teachers = await db.teacher.findMany({
        where: { schoolId: session.schoolId },
        orderBy: { firstName: 'asc' }
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Teachers Directory</h1>
                <div className="flex gap-2">
                    <Button variant="outline" disabled>
                        <Printer className="mr-2 h-4 w-4" />
                        Print
                    </Button>
                    <Link href="/school/teachers/new">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Teacher
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="rounded-md border border-border">
                <Table>
                    <TableCaption>A list of all registered teachers.</TableCaption>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[80px]">Photo</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead>Qualification</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Salary</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {teachers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                                    No teachers found. Add your first teacher to get started.
                                </TableCell>
                            </TableRow>
                        ) : (
                            teachers.map((teacher: any) => (
                                <TableRow key={teacher.id}>
                                    <TableCell>
                                        <div className="relative h-10 w-10 rounded-full overflow-hidden bg-muted">
                                            {teacher.photograph ? (
                                                <Image
                                                    src={teacher.photograph}
                                                    alt={`${teacher.firstName} ${teacher.lastName}`}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center h-full w-full text-xs text-muted-foreground">
                                                    {teacher.firstName[0]}
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium text-foreground">
                                        {teacher.firstName} {teacher.lastName}
                                        <div className="text-xs text-muted-foreground">{teacher.email}</div>
                                    </TableCell>
                                    <TableCell>{teacher.subject}</TableCell>
                                    <TableCell>{teacher.qualification}</TableCell>
                                    <TableCell>{teacher.phone}</TableCell>
                                    <TableCell>{teacher.salary.toLocaleString()}</TableCell>
                                    <TableCell className="text-right">
                                        <Link href={`/school/teachers/${teacher.id}/edit`}>
                                            <Button variant="ghost" size="icon">
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
