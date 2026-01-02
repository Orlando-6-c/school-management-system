'use client';

import { useEffect, useState } from 'react';
import { getSchools, impersonateSchoolAdmin } from '@/actions/school';
import { CreateSchoolDialog } from '@/components/admin/CreateSchoolDialog';
import { Button } from '@/components/ui/button';
import clsx from 'clsx';
import { LogIn } from 'lucide-react';

export default function SchoolsPage() {
    const [schools, setSchools] = useState<any[]>([]);

    useEffect(() => {
        getSchools().then(setSchools);
    }, []);

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Schools</h1>
                    <p className="text-gray-500 mt-2">
                        Manage your school tenants and their administrators.
                    </p>
                </div>
                <CreateSchoolDialog onSuccess={() => getSchools().then(setSchools)} />
            </div>

            <div className="rounded-md border border-gray-200 bg-white shadow-sm">
                <div className="w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm text-left text-gray-900">
                        <thead className="[&_tr]:border-b border-gray-200 bg-gray-50">
                            <tr className="border-b transition-colors hover:bg-gray-100/50">
                                <th className="h-12 px-4 align-middle font-semibold text-gray-700">Name</th>
                                <th className="h-12 px-4 align-middle font-semibold text-gray-700">Slug</th>
                                <th className="h-12 px-4 align-middle font-semibold text-gray-700">Active Students</th>
                                <th className="h-12 px-4 align-middle font-semibold text-gray-700">Created At</th>
                                <th className="h-12 px-4 align-middle font-semibold text-gray-700 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {schools.map((school) => (
                                <tr key={school.id} className="border-b border-gray-100 transition-colors hover:bg-gray-50">
                                    <td className="p-4 align-middle font-medium text-gray-900">{school.name}</td>
                                    <td className="p-4 align-middle text-gray-600">{school.slug}</td>
                                    <td className="p-4 align-middle text-gray-600">{school._count?.students || 0}</td>
                                    <td className="p-4 align-middle text-gray-600">{new Date(school.createdAt).toLocaleDateString()}</td>
                                    <td className="p-4 align-middle text-right">
                                        <form action={impersonateSchoolAdmin.bind(null, school.id)}>
                                            <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                                                <LogIn className="mr-2 h-4 w-4" />
                                                Login as Admin
                                            </Button>
                                        </form>
                                    </td>
                                </tr>
                            ))}
                            {schools.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-4 align-middle text-center text-gray-500 bg-gray-50/50">
                                        No schools found. Create one to get started.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
