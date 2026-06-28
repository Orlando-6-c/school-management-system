'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { addStaff, updateStaff, type StaffState } from '@/actions/staff';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { PhotoUpload } from '@/components/ui/photo-upload';

interface Extra { name: string; amount: string }

interface StaffFormProps {
    staffId?: string;
    defaultValues?: {
        name?: string;
        fatherName?: string;
        cnic?: string;
        dateOfBirth?: string;
        contact?: string;
        gender?: 'Male' | 'Female';
        role?: string;
        workingHours?: string;
        salary?: number;
        salaryExtras?: { name: string; amount: number }[];
        photograph?: string;
    };
}

export function StaffForm({ staffId, defaultValues }: StaffFormProps) {
    const router = useRouter();
    const isEdit = !!staffId;
    const action = isEdit ? updateStaff : addStaff;

    const [state, formAction, isPending] = useActionState<StaffState | undefined, FormData>(action, undefined);

    const [form, setForm] = useState({
        name: defaultValues?.name ?? '',
        fatherName: defaultValues?.fatherName ?? '',
        cnic: defaultValues?.cnic ?? '',
        dateOfBirth: defaultValues?.dateOfBirth ?? '',
        contact: defaultValues?.contact ?? '',
        role: defaultValues?.role ?? '',
        workingHours: defaultValues?.workingHours ?? '',
        salary: defaultValues?.salary?.toString() ?? '0',
        photograph: defaultValues?.photograph ?? '',
    });
    const [gender, setGender] = useState<string>(defaultValues?.gender ?? '');
    const [userRole, setUserRole] = useState<string>('');
    const [extras, setExtras] = useState<Extra[]>(
        (defaultValues?.salaryExtras ?? []).map(e => ({ name: e.name, amount: e.amount.toString() }))
    );

    const field =
        (name: keyof typeof form) =>
        (e: React.ChangeEvent<HTMLInputElement>) =>
            setForm((prev) => ({ ...prev, [name]: e.target.value }));

    function addExtra() {
        setExtras(prev => [...prev, { name: '', amount: '' }]);
    }

    function removeExtra(idx: number) {
        setExtras(prev => prev.filter((_, i) => i !== idx));
    }

    function updateExtra(idx: number, field: 'name' | 'amount', value: string) {
        setExtras(prev => prev.map((e, i) => i === idx ? { ...e, [field]: value } : e));
    }

    useEffect(() => {
        if (state?.success) router.push('/school/staff');
    }, [state?.success, router]);

    const serializedExtras = JSON.stringify(
        extras
            .filter(e => e.name.trim() && e.amount !== '')
            .map(e => ({ name: e.name.trim(), amount: parseFloat(e.amount) || 0 }))
    );

    return (
        <form action={formAction} className="space-y-4">
            {isEdit && <input type="hidden" name="id" value={staffId} />}
            <input type="hidden" name="salaryExtras" value={serializedExtras} />

            {state?.message && !state.success && (
                <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                    {state.message}
                </p>
            )}

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input id="name" name="name" value={form.name} onChange={field('name')} />
                    {state?.errors?.name && <p className="text-xs text-destructive">{state.errors.name[0]}</p>}
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="fatherName">Father Name *</Label>
                    <Input id="fatherName" name="fatherName" value={form.fatherName} onChange={field('fatherName')} />
                    {state?.errors?.fatherName && <p className="text-xs text-destructive">{state.errors.fatherName[0]}</p>}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor="cnic">CNIC *</Label>
                    <Input id="cnic" name="cnic" placeholder="3520212345671" value={form.cnic} onChange={field('cnic')} />
                    {state?.errors?.cnic && <p className="text-xs text-destructive">{state.errors.cnic[0]}</p>}
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                    <Input id="dateOfBirth" name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={field('dateOfBirth')} />
                    {state?.errors?.dateOfBirth && <p className="text-xs text-destructive">{state.errors.dateOfBirth[0]}</p>}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor="contact">Contact *</Label>
                    <Input id="contact" name="contact" placeholder="03001234567" value={form.contact} onChange={field('contact')} />
                    {state?.errors?.contact && <p className="text-xs text-destructive">{state.errors.contact[0]}</p>}
                </div>
                <div className="space-y-1.5">
                    <Label>Gender *</Label>
                    <input type="hidden" name="gender" value={gender} />
                    <Select value={gender} onValueChange={setGender}>
                        <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                        </SelectContent>
                    </Select>
                    {state?.errors?.gender && <p className="text-xs text-destructive">{state.errors.gender[0]}</p>}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor="role">Designation / Role *</Label>
                    <Input id="role" name="role" placeholder="e.g. Peon, Security Guard, Librarian" value={form.role} onChange={field('role')} />
                    {state?.errors?.role && <p className="text-xs text-destructive">{state.errors.role[0]}</p>}
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="workingHours">Working Hours *</Label>
                    <Input id="workingHours" name="workingHours" placeholder="e.g. 8 AM – 4 PM" value={form.workingHours} onChange={field('workingHours')} />
                    {state?.errors?.workingHours && <p className="text-xs text-destructive">{state.errors.workingHours[0]}</p>}
                </div>
            </div>

            {/* Salary Section */}
            <div className="border border-border rounded-lg p-4 space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Salary</h3>
                <div className="space-y-1.5">
                    <Label htmlFor="salary">Base Monthly Salary (Rs)</Label>
                    <Input id="salary" name="salary" type="number" min="0" value={form.salary} onChange={field('salary')} placeholder="0" />
                    {state?.errors?.salary && <p className="text-xs text-destructive">{state.errors.salary[0]}</p>}
                </div>

                {extras.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">Extras (positive = allowance, negative = deduction)</p>
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
                                    placeholder="Amount (e.g. 2000 or -500)"
                                    value={extra.amount}
                                    onChange={e => updateExtra(idx, 'amount', e.target.value)}
                                    className="w-40 h-8 text-sm"
                                />
                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeExtra(idx)}>
                                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}

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
            </div>

            <div className="space-y-1.5">
                <Label>Photograph (optional)</Label>
                <PhotoUpload name="photograph" defaultValue={defaultValues?.photograph ?? ''} />
            </div>

            {!isEdit && (
                <div className="space-y-1.5">
                    <Label>System Login Role (optional)</Label>
                    <input type="hidden" name="userRole" value={userRole} />
                    <Select value={userRole} onValueChange={setUserRole}>
                        <SelectTrigger><SelectValue placeholder="None — no login account" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Finance">Finance (CNIC used as username)</SelectItem>
                            <SelectItem value="ReadOnly">Staff / Read-only (CNIC used as username)</SelectItem>
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                        If set, a login account is created with the CNIC as the username.
                    </p>
                </div>
            )}

            <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={isPending}>
                    {isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Staff Member'}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.push('/school/staff')}>
                    Cancel
                </Button>
            </div>
        </form>
    );
}
