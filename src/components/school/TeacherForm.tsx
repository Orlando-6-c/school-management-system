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
    const updateTeacherWithId = initialData ? updateTeacher.bind(null, initialData.id) : null;
    const action = initialData ? updateTeacherWithId! : addTeacher;

    const [state, formAction] = useActionState(action, initialState);
    // Add pending state manually since useActionState's pending is only for the submission itself, 
    // but we might want to track it for disables.
    // Actually useFormStatus is better for buttons, but for redirect we use useEffect.

    // We need to use useFormStatus in a child or just rely on state.success
    const [pending, setPending] = useState(false);

    useEffect(() => {
        if (state?.success) {
            router.push('/school/teachers');
            router.refresh(); // Refresh to show new data
        }
    }, [state?.success, router]);

    return (
        <form action={(formData) => {
            setPending(true);
            formAction(formData);
        }}>
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
                            <Input id="firstName" name="firstName" defaultValue={initialData?.firstName} required />
                            {state?.errors?.firstName && <p className="text-red-500 text-xs">{state.errors.firstName}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input id="lastName" name="lastName" defaultValue={initialData?.lastName} required />
                            {state?.errors?.lastName && <p className="text-red-500 text-xs">{state.errors.lastName}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="gender">Gender</Label>
                            <Select name="gender" defaultValue={initialData?.gender || "Male"} required>
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
                            <Input id="cnic" name="cnic" placeholder="12345-1234567-1" defaultValue={initialData?.cnic} required />
                            {state?.errors?.cnic && <p className="text-red-500 text-xs">{state.errors.cnic}</p>}
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="photograph">Photograph URL</Label>
                            <Input id="photograph" name="photograph" placeholder="https://..." defaultValue={initialData?.photograph} />
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
                            <Input id="qualification" name="qualification" defaultValue={initialData?.qualification} required />
                            {state?.errors?.qualification && <p className="text-red-500 text-xs">{state.errors.qualification}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="subject">Main Subject</Label>
                            <Input id="subject" name="subject" defaultValue={initialData?.subject} required />
                            {state?.errors?.subject && <p className="text-red-500 text-xs">{state.errors.subject}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="experience">Experience</Label>
                            <Input id="experience" name="experience" placeholder="e.g. 5 Years" defaultValue={initialData?.experience} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="joiningDate">Joining Date</Label>
                            <Input
                                id="joiningDate"
                                name="joiningDate"
                                type="date"
                                defaultValue={initialData?.joiningDate ? new Date(initialData.joiningDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="salary">Monthly Salary</Label>
                            <Input id="salary" name="salary" type="number" defaultValue={initialData?.salary} required />
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
                            <Input id="phone" name="phone" defaultValue={initialData?.phone} required />
                            {state?.errors?.phone && <p className="text-red-500 text-xs">{state.errors.phone}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" defaultValue={initialData?.email} />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="address">Address</Label>
                            <Input id="address" name="address" defaultValue={initialData?.address} />
                        </div>
                    </CardContent>
                </Card>

                {state?.message && !state.success && (
                    <div className="p-4 bg-red-50 text-red-600 rounded-md">
                        {state.message}
                    </div>
                )}

                <div className="flex justify-end gap-4">
                    <Button variant="outline" type="button" onClick={() => router.back()}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={pending}>
                        {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {initialData ? 'Update Teacher' : 'Add Teacher'}
                    </Button>
                </div>
            </div>
        </form>
    );
}
