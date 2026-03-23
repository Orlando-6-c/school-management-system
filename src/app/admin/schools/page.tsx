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
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Schools</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage your school tenants and their administrators.
                    </p>
                </div>
                <CreateSchoolDialog onSuccess={() => getSchools().then(setSchools)} />
            </div>

            <div className="rounded-md border border-border bg-card shadow-sm">
                <div className="w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm text-left text-foreground">
                        <thead className="[&_tr]:border-b border-border bg-muted">
                            <tr className="border-b transition-colors hover:bg-secondary/50">
                                <th className="h-12 px-4 align-middle font-semibold text-muted-foreground">Name</th>
                                <th className="h-12 px-4 align-middle font-semibold text-muted-foreground">Slug</th>
                                <th className="h-12 px-4 align-middle font-semibold text-muted-foreground">Active Students</th>
                                <th className="h-12 px-4 align-middle font-semibold text-muted-foreground">Created At</th>
                                <th className="h-12 px-4 align-middle font-semibold text-muted-foreground text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {schools.map((school) => (
                                <tr key={school.id} className="border-b border-gray-100 transition-colors hover:bg-muted">
                                    <td className="p-4 align-middle font-medium text-foreground">{school.name}</td>
                                    <td className="p-4 align-middle text-muted-foreground">{school.slug}</td>
                                    <td className="p-4 align-middle text-muted-foreground">{school._count?.students || 0}</td>
                                    <td className="p-4 align-middle text-muted-foreground">{new Date(school.createdAt).toLocaleDateString()}</td>
                                    <td className="p-4 align-middle text-right">
                                        <form action={impersonateSchoolAdmin.bind(null, school.id)}>
                                            <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-indigo-50">
                                                <LogIn className="mr-2 h-4 w-4" />
                                                Login as Admin
                                            </Button>
                                        </form>
                                    </td>
                                </tr>
                            ))}
                            {schools.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-4 align-middle text-center text-muted-foreground bg-muted/50">
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
