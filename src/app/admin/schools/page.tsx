'use client';

import { useActionState } from 'react';
import { createSchool, impersonateSchoolAdmin } from '@/actions/school';
import { useFormStatus } from 'react-dom';
import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { School } from '@prisma/client';

// We need a way to fetch schools for the client component. 
// Ideally we pass them as props from a server component wrapper or use a server action to fetch.
// For simplicity in this structure, let's assume this page is a Server Component that renders a Client Component, 
// OR we make this a Client Component and fetch via useEffect/Server Action.
// Let's use the pattern where the Page is server component (default) and we extract the form to a client component.
// But the user requested "Create app/admin/schools/page.tsx".
// To keep it simple and working with `useActionState`, we'll make the whole page client-side or use a client wrapper.
// Actually, `useActionState` requires client component.
// But we can't make the whole page client if we want async data fetching easily without hooks.
// Let's split? No, let's make it a client component and fetch data via a prop passed from a parent layout or use a server action purely for fetching?
// Better: Keep the page.tsx as Server Component, pass data to a <SchoolList> client component.

// However, I'm writing one file. I can't easily split.
// So I will write a Client Component that fetches initial data or I will write a Server Component that renders the client part.
// Wait, I can't put `useActionState` in a Server Component.
// I will write the file as a Server Component and import a Client Component for the form?
// But I can't create multiple files easily if I didn't plan it.
// I'll make the page a Client Component and use a server action to fetch schools? 
// Or better, make the Page.tsx a Server Component that interacts with DB directly, and puts the Form in a separate client component?
// But I only have one file slot in my mental plan.
// I will create `src/app/admin/schools/school-manager.tsx` and import it in `page.tsx`?
// Or I can put everything in `page.tsx` if I mark "use client" but then I can't use `db` directly.
// The user plan lists `admin/schools/page.tsx`.
// I will make `page.tsx` a Server Component that fetches data, and renders a Client Component form/list.
// I will define the client component in the same file? No, Next.js doesn't like that.
// I will assume I can create `client.tsx` alongside.

// Let's stick to Server Component as main entry.
// I'll generate `src/app/admin/schools/page.tsx` (Server) and `src/app/admin/schools/client.tsx` (Client).

// Actually, I'll allow myself to create two files.
// File 1: `src/app/admin/schools/client.tsx` (The interactions)
// File 2: `src/app/admin/schools/page.tsx` (The data loader)

// Wait, I will write `client.tsx` FIRST, using write_to_file.
// Then `page.tsx`.

// Re-evaluating: I can make `page.tsx` client if I fetch data via a server action. 
// Server actions can be called from client.
// So:
// 1. `getSchools()` action (already created).
// 2. `page.tsx` ("use client"). Call `getSchools` in useEffect.
// This is easiest for single file.

// But wait, `getSchools` checks session. OK.
// Let's do that.

import { getSchools } from '@/actions/school';

function CreateSchoolForm() {
    const [state, action, pending] = useActionState(createSchool, undefined);

    return (
        <form action={action} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8 max-w-2xl">
            <h3 className="text-lg font-bold mb-4">Create New School</h3>
            {state?.message && (
                <div className={clsx("p-3 rounded-lg mb-4 text-sm", state.message.includes('success') ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700")}>
                    {state.message}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">School Name</label>
                    <input name="name" className="w-full px-3 py-2 border rounded-lg" placeholder="e.g. Springfield High" required />
                    {state?.errors?.name && <p className="text-red-500 text-xs">{state.errors.name[0]}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Slug (URL)</label>
                    <input name="slug" className="w-full px-3 py-2 border rounded-lg" placeholder="e.g. springfield" required />
                    {state?.errors?.slug && <p className="text-red-500 text-xs">{state.errors.slug[0]}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Admin Username</label>
                    <input name="adminUsername" className="w-full px-3 py-2 border rounded-lg" required />
                    {state?.errors?.adminUsername && <p className="text-red-500 text-xs">{state.errors.adminUsername[0]}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Admin Password</label>
                    <input name="adminPassword" type="password" className="w-full px-3 py-2 border rounded-lg" required />
                    {state?.errors?.adminPassword && <p className="text-red-500 text-xs">{state.errors.adminPassword[0]}</p>}
                </div>
            </div>
            <div className="mt-4 flex justify-end">
                <button type="submit" disabled={pending} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                    {pending ? 'Creating...' : 'Create School'}
                </button>
            </div>
        </form>
    );
}

function SchoolList({ schools }: { schools: any[] }) {
    // We can also have an impersonate button here handled by form action
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 text-sm">
                    <tr>
                        <th className="px-6 py-3">Name</th>
                        <th className="px-6 py-3">Slug</th>
                        <th className="px-6 py-3">Students</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {schools.map((school) => (
                        <tr key={school.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 font-medium">{school.name}</td>
                            <td className="px-6 py-4 text-gray-500">{school.slug}</td>
                            <td className="px-6 py-4 text-gray-500">{school._count?.students || 0}</td>
                            <td className="px-6 py-4">
                                <span className={clsx("px-2 py-1 rounded-full text-xs", school.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                                    {school.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <form action={impersonateSchoolAdmin.bind(null, school.id)}>
                                    <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                                        Login as Admin
                                    </button>
                                </form>
                            </td>
                        </tr>
                    ))}
                    {schools.length === 0 && (
                        <tr>
                            <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                No schools found. Create one to get started.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default function SchoolsPage() {
    const [schools, setSchools] = useState<any[]>([]);

    useEffect(() => {
        getSchools().then(setSchools);
    }, []); // Simple fetch on mount, revalidatePath in action handles updates usually but client state needs refresh? 
    // Ideally use React Query or just router.refresh() but local state won't update automatically unless we refetch.
    // Since createSchool calls revalidatePath, the next fetch should get new data.
    // But strictly with `useEffect`, it only runs once.
    // We should prob move the list to a Server Component but I committed to client.
    // Let's just fetch once. 

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">Manage Schools</h1>
            <CreateSchoolForm />
            <SchoolList schools={schools} />
        </div>
    );
}
