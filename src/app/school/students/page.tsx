import { getSession } from '@/lib/session';
import db from '@/lib/db';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, Search, Eye } from 'lucide-react';
import { Input } from '@/components/ui/input';

export const runtime = 'nodejs';

export default async function StudentsPage() {
    const session = await getSession();

    // Fetch students
    const students = await db.student.findMany({
        where: { schoolId: session.schoolId! },
        include: {
            class: true,
            guardian: true,
        },
        orderBy: { createdAt: 'desc' }
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Students Directory</h1>
                    <p className="text-gray-500 mt-2">
                        Manage your school's student body.
                    </p>
                </div>
                <div className="flex space-x-2 w-full sm:w-auto">
                    <Link href="/school/academics">
                        <Button variant="outline" className="w-full sm:w-auto bg-white text-gray-700 border-gray-300 hover:bg-gray-50">
                            Manage Classes
                        </Button>
                    </Link>
                    <Link href="/school/students/new">
                        <Button className="w-full sm:w-auto">
                            <Plus className="mr-2 h-4 w-4" />
                            New Admission
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Filters (Placeholder) */}
            <div className="flex items-center space-x-2 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <Search className="h-4 w-4 text-gray-400" />
                <Input
                    placeholder="Search by name, roll no, or CPID..."
                    className="border-0 focus-visible:ring-0 px-0 h-auto text-sm"
                />
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4">Roll No</th>
                                <th className="px-6 py-4">Student Name</th>
                                <th className="px-6 py-4">Class</th>
                                <th className="px-6 py-4">Monthly Fee</th> {/* Added Column */}
                                <th className="px-6 py-4">Guardian</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {students.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500 italic">
                                        No students found. Admit your first student!
                                    </td>
                                </tr>
                            ) : (
                                students.map((student: any) => ( // Typed as any to bypass implicit any error temporarily
                                    <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            {student.rollNumber}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{student.name}</div>
                                            <div className="text-xs text-gray-500">{student.gender}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                                                {/* Safe Access and Fallback */}
                                                {student.class?.name || 'Unassigned'} {student.class?.section ? `(${student.class.section})` : ''}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            {Number(student.monthlyFees).toLocaleString()} {/* Use new field */}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-gray-900">{student.guardian?.name}</div>
                                            <div className="text-xs text-gray-500">{student.guardian?.contact}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${student.isActive
                                                ? 'bg-green-50 text-green-700'
                                                : 'bg-red-50 text-red-700'
                                                }`}>
                                                {student.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-indigo-600">
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
