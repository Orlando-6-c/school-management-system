import { getSession } from '@/lib/session';
import db from '@/lib/db';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Plus, Search, Edit, Printer } from 'lucide-react';
import { Input } from '@/components/ui/input';
import PrintButton from '@/components/PrintButton';

export const runtime = 'nodejs';

export default async function StudentsPage() {
    const session = await getSession();

    // 1. Fetch Students with Photo and Relations
    const students = await db.student.findMany({
        where: { schoolId: session.schoolId! },
        include: {
            class: true,
            guardian: true,
        },
        orderBy: { createdAt: 'desc' },
    });



    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Student Directory</h1>
                <div className="flex gap-2">
                    <PrintButton label="Print Directory" />
                    <Link href="/school/students/new">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            New Admission
                        </Button>
                    </Link>
                </div>
            </div>

            <Card className="bg-white border-gray-200 shadow-sm print:shadow-none print:border-none">
                <CardHeader className="print:hidden">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-gray-900">Enrolled Students</CardTitle>
                            <CardDescription>
                                Total Students: {students.length}
                            </CardDescription>
                        </div>
                        <div className="relative w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                            <Input
                                placeholder="Search by name, roll no..."
                                className="pl-8 bg-white border-gray-300"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="print:p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[80px]">Photo</TableHead>
                                <TableHead>Roll No</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Class</TableHead>
                                <TableHead>Guardian</TableHead>
                                <TableHead>Fee</TableHead>
                                <TableHead className="text-right print:hidden">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {students.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center h-24 text-gray-500">
                                        No students found. Admit a student to get started.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                students.map((student: any) => (
                                    <TableRow key={student.id}>
                                        {/* Photo Column */}
                                        <TableCell>
                                            {student.photograph ? (
                                                <img
                                                    src={student.photograph}
                                                    alt={student.name}
                                                    className="h-10 w-10 rounded-full object-cover border border-gray-200"
                                                />
                                            ) : (
                                                <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-400 border border-gray-200">
                                                    No Pic
                                                </div>
                                            )}
                                        </TableCell>

                                        <TableCell className="font-medium text-gray-900">
                                            {student.rollNumber}
                                        </TableCell>
                                        <TableCell className="text-gray-700">
                                            {student.name}
                                        </TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
                                                {student.class?.name ?? 'Unassigned'} {student.class?.section ? `(${student.class.section})` : ''}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-gray-600">
                                            {student.guardian?.name || 'N/A'}
                                            <div className="text-xs text-gray-400">
                                                {student.guardian?.contact || 'No Contact'}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {Number(student.discountPercentage) > 0 ? (
                                                <div className="flex flex-col">
                                                    <span className="text-xs line-through text-gray-400">
                                                        {Number(student.monthlyFees)}
                                                    </span>
                                                    <span className="font-bold text-gray-900">
                                                        {Number(student.finalFee)}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="font-bold text-gray-900">
                                                    {Number(student.monthlyFees)}
                                                </span>
                                            )}
                                        </TableCell>

                                        {/* Actions Column */}
                                        <TableCell className="text-right print:hidden">
                                            <div className="flex justify-end gap-2">
                                                {/* Edit Button */}
                                                <Button variant="ghost" size="icon" title="Edit Student" asChild>
                                                    <Link href={`/school/students/${student.id}/edit`}>
                                                        <Edit className="h-4 w-4 text-blue-600" />
                                                    </Link>
                                                </Button>

                                                {/* Individual Print Button */}
                                                <Button variant="ghost" size="icon" title="Print Student Info" asChild>
                                                    <Link href={`/school/students/${student.id}/print`} target="_blank">
                                                        <Printer className="h-4 w-4 text-gray-600" />
                                                    </Link>
                                                </Button>
                                            </div>
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
