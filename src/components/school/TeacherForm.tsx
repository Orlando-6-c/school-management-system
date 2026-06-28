'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { addTeacher, updateTeacher, TeacherState } from '@/actions/teacher';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { PhotoUpload } from '@/components/ui/photo-upload';

interface Extra { name: string; amount: string }

const initialState: TeacherState = {
    message: '',
    errors: {},
};

export default function TeacherForm({ initialData }: { initialData?: any }) {
    const router = useRouter();
    const action = initialData ? updateTeacher.bind(null, initialData.id) : addTeacher;

    const [state, formAction, isPending] = useActionState(action, initialState);

    const [form, setForm] = useState({
        firstName: initialData?.firstName ?? '',
        lastName: initialData?.lastName ?? '',
        gender: initialData?.gender ?? 'Male',
        cnic: initialData?.cnic ?? '',
        photograph: '',
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

    const [extras, setExtras] = useState<Extra[]>(
        (Array.isArray(initialData?.salaryExtras) ? initialData.salaryExtras : []).map((e: any) => ({
            name: e.name,
            amount: e.amount.toString(),
        }))
    );

    function addExtra() { setExtras(prev => [...prev, { name: '', amount: '' }]); }
    function removeExtra(idx: number) { setExtras(prev => prev.filter((_, i) => i !== idx)); }
    function updateExtra(idx: number, field: 'name' | 'amount', value: string) {
        setExtras(prev => prev.map((e, i) => i === idx ? { ...e, [field]: value } : e));
    }

    const serializedExtras = JSON.stringify(
        extras.filter(e => e.name.trim() && e.amount !== '')
              .map(e => ({ name: e.name.trim(), amount: parseFloat(e.amount) || 0 }))
    );

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
            <input type="hidden" name="salaryExtras" value={serializedExtras} />
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
                            <Label>Photograph</Label>
                            <PhotoUpload name="photograph" defaultValue={initialData?.photograph ?? ''} />
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
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="salary">Base Monthly Salary (Rs)</Label>
                            <Input id="salary" name="salary" type="number" min="0" value={form.salary} onChange={field('salary')} required />
                            {state?.errors?.salary && <p className="text-red-500 text-xs">{state.errors.salary}</p>}
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label className="text-sm font-medium">Salary Extras / Deductions</Label>
                            <div className="space-y-2">
                                {extras.map((extra, idx) => (
                                    <div key={idx} className="flex gap-2 items-center">
                                        <Input
                                            placeholder="e.g. Transport Allowance"
                                            value={extra.name}
                                            onChange={e => updateExtra(idx, 'name', e.target.value)}
                                            className="flex-1 h-8 text-sm"
                                        />
                                        <Input
                                            type="number"
                                            placeholder="Amount (positive or negative)"
                                            value={extra.amount}
                                            onChange={e => updateExtra(idx, 'amount', e.target.value)}
                                            className="w-44 h-8 text-sm"
                                        />
                                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeExtra(idx)}>
                                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                        </Button>
                                    </div>
                                ))}
                                <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={addExtra}>
                                    <Plus className="h-3.5 w-3.5 mr-1" /> Add Extra / Deduction
                                </Button>
                                {extras.filter(e => e.name && e.amount !== '').length > 0 && (
                                    <p className="text-xs text-muted-foreground">
                                        Net salary: Rs {(
                                            parseFloat(form.salary || '0') +
                                            extras.filter(e => e.name && e.amount !== '').reduce((s, e) => s + (parseFloat(e.amount) || 0), 0)
                                        ).toLocaleString('en-PK')}
                                    </p>
                                )}
                                <p className="text-xs text-muted-foreground">Positive = allowance, negative = deduction (e.g. -500 for a penalty).</p>
                            </div>
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
