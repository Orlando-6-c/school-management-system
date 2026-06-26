'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { addTeacher, updateTeacher, TeacherState } from '@/actions/teacher';
import { Loader2 } from 'lucide-react';

const initialState: TeacherState = {
    message: '',
    errors: {},
};

export default function TeacherForm({ initialData }: { initialData?: any }) {
    const router = useRouter();
    const action = initialData ? updateTeacher.bind(null, initialData.id) : addTeacher;

    // Use all 3 return values — isPending replaces the old manual setPending state
    const [state, formAction, isPending] = useActionState(action, initialState);

    // Controlled state preserves user input when the server action returns validation errors.
    // React 19 resets uncontrolled (defaultValue) inputs after any form action completes.
    const [form, setForm] = useState({
        firstName: initialData?.firstName ?? '',
        lastName: initialData?.lastName ?? '',
        gender: initialData?.gender ?? 'Male',
        cnic: initialData?.cnic ?? '',
        photograph: initialData?.photograph ?? '',
        qualification: initialData?.qualification ?? '',
        subject: initialData?.subject ?? '',
        experience: initialData?.experience ?? '',
        joiningDate: initialData?.joiningDate
            ? new Date(initialData.joiningDate).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0],
        salary: initialData?.salary?.toString() ?? '',
        phone: initialData?.phone ?? '',
        email: initialData?.email ?? '',
        address: initialData?.address ?? '',
    });

    useEffect(() => {
        if (state?.success) {
            router.push('/school/teachers');
            router.refresh();
        }
    }, [state?.success, router]);

    const field =
        (name: keyof typeof form) =>
        (e: React.ChangeEvent<HTMLInputElement>) =>
            setForm((prev) => ({ ...prev, [name]: e.target.value }));

    return (
        <form action={formAction}>
            <div className="grid gap-6">
                {/* Profile Section */}
                <Card className="border-border">
                    <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                        <CardDescription>Basic details about the teacher.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">First Name</Label>
                            <Input id="firstName" name="firstName" value={form.firstName} onChange={field('firstName')} required />
                            {state?.errors?.firstName && <p className="text-red-500 text-xs">{state.errors.firstName}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input id="lastName" name="lastName" value={form.lastName} onChange={field('lastName')} required />
                            {state?.errors?.lastName && <p className="text-red-500 text-xs">{state.errors.lastName}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="gender">Gender</Label>
                            {/* hidden input carries the value; Select is the visible control */}
                            <input type="hidden" name="gender" value={form.gender} />
                            <Select value={form.gender} onValueChange={(v) => setForm((p) => ({ ...p, gender: v }))}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Gender" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Male">Male</SelectItem>
                                    <SelectItem value="Female">Female</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="cnic">CNIC</Label>
                            <Input id="cnic" name="cnic" placeholder="12345-1234567-1" value={form.cnic} onChange={field('cnic')} required />
                            {state?.errors?.cnic && <p className="text-red-500 text-xs">{state.errors.cnic}</p>}
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="photograph">Photograph URL</Label>
                            <Input id="photograph" name="photograph" placeholder="https://..." value={form.photograph} onChange={field('photograph')} />
                        </div>
                    </CardContent>
                </Card>

                {/* Professional Section */}
                <Card className="border-border">
                    <CardHeader>
                        <CardTitle>Professional Details</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="qualification">Qualification</Label>
                            <Input id="qualification" name="qualification" value={form.qualification} onChange={field('qualification')} required />
                            {state?.errors?.qualification && <p className="text-red-500 text-xs">{state.errors.qualification}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="subject">Main Subject</Label>
                            <Input id="subject" name="subject" value={form.subject} onChange={field('subject')} required />
                            {state?.errors?.subject && <p className="text-red-500 text-xs">{state.errors.subject}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="experience">Experience</Label>
                            <Input id="experience" name="experience" placeholder="e.g. 5 Years" value={form.experience} onChange={field('experience')} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="joiningDate">Joining Date</Label>
                            <Input
                                id="joiningDate"
                                name="joiningDate"
                                type="date"
                                value={form.joiningDate}
                                onChange={field('joiningDate')}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="salary">Monthly Salary</Label>
                            <Input id="salary" name="salary" type="number" value={form.salary} onChange={field('salary')} required />
                            {state?.errors?.salary && <p className="text-red-500 text-xs">{state.errors.salary}</p>}
                        </div>
                    </CardContent>
                </Card>

                {/* Contact Section */}
                <Card className="border-border">
                    <CardHeader>
                        <CardTitle>Contact Information</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input id="phone" name="phone" value={form.phone} onChange={field('phone')} required />
                            {state?.errors?.phone && <p className="text-red-500 text-xs">{state.errors.phone}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" value={form.email} onChange={field('email')} required />
                            {state?.errors?.email && <p className="text-red-500 text-xs">{state.errors.email}</p>}
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="address">Address</Label>
                            <Input id="address" name="address" value={form.address} onChange={field('address')} />
                        </div>
                    </CardContent>
                </Card>

                {state?.message && !state.success && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md border border-red-200 dark:border-red-800">
                        {state.message}
                    </div>
                )}

                <div className="flex justify-end gap-4">
                    <Button variant="outline" type="button" onClick={() => router.back()}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {initialData ? 'Update Teacher' : 'Add Teacher'}
                    </Button>
                </div>
            </div>
        </form>
    );
}
