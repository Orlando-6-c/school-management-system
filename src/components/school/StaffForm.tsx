'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { addStaff, updateStaff, type StaffState } from '@/actions/staff';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
        photograph?: string;
    };
}

export function StaffForm({ staffId, defaultValues }: StaffFormProps) {
    const router = useRouter();
    const isEdit = !!staffId;
    const action = isEdit ? updateStaff : addStaff;

    const [state, formAction, isPending] = useActionState<StaffState | undefined, FormData>(action, undefined);
    const [gender, setGender] = useState<string>(defaultValues?.gender ?? '');
    const [userRole, setUserRole] = useState<string>('');

    useEffect(() => {
        if (state?.success) router.push('/school/staff');
    }, [state?.success, router]);

    return (
        <form action={formAction} className="space-y-4">
            {isEdit && <input type="hidden" name="id" value={staffId} />}

            {state?.message && !state.success && (
                <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                    {state.message}
                </p>
            )}

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input id="name" name="name" defaultValue={defaultValues?.name} />
                    {state?.errors?.name && <p className="text-xs text-destructive">{state.errors.name[0]}</p>}
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="fatherName">Father Name *</Label>
                    <Input id="fatherName" name="fatherName" defaultValue={defaultValues?.fatherName} />
                    {state?.errors?.fatherName && <p className="text-xs text-destructive">{state.errors.fatherName[0]}</p>}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor="cnic">CNIC *</Label>
                    <Input id="cnic" name="cnic" placeholder="3520212345671" defaultValue={defaultValues?.cnic} />
                    {state?.errors?.cnic && <p className="text-xs text-destructive">{state.errors.cnic[0]}</p>}
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                    <Input id="dateOfBirth" name="dateOfBirth" type="date" defaultValue={defaultValues?.dateOfBirth} />
                    {state?.errors?.dateOfBirth && <p className="text-xs text-destructive">{state.errors.dateOfBirth[0]}</p>}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor="contact">Contact *</Label>
                    <Input id="contact" name="contact" placeholder="03001234567" defaultValue={defaultValues?.contact} />
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
                    <Input id="role" name="role" placeholder="e.g. Peon, Security Guard, Librarian" defaultValue={defaultValues?.role} />
                    {state?.errors?.role && <p className="text-xs text-destructive">{state.errors.role[0]}</p>}
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="workingHours">Working Hours *</Label>
                    <Input id="workingHours" name="workingHours" placeholder="e.g. 8 AM – 4 PM" defaultValue={defaultValues?.workingHours} />
                    {state?.errors?.workingHours && <p className="text-xs text-destructive">{state.errors.workingHours[0]}</p>}
                </div>
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="photograph">Photo URL (optional)</Label>
                <Input id="photograph" name="photograph" placeholder="https://..." defaultValue={defaultValues?.photograph} />
            </div>

            {!isEdit && (
                <div className="space-y-1.5">
                    <Label>System Login Role (optional)</Label>
                    <input type="hidden" name="userRole" value={userRole} />
                    <Select value={userRole} onValueChange={setUserRole}>
                        <SelectTrigger><SelectValue placeholder="None — no login account" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">None</SelectItem>
                            <SelectItem value="Finance">Finance (CNIC used as username)</SelectItem>
                            <SelectItem value="Staff">Staff (CNIC used as username)</SelectItem>
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
