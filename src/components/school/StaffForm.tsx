'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { addStaff, StaffState } from '@/actions/staff';
import { Loader2 } from 'lucide-react';

const initialState: StaffState = {
    message: '',
    errors: {},
};

export default function StaffForm() {
    const router = useRouter();
    const [state, formAction] = useActionState(addStaff, initialState);
    const [pending, setPending] = useState(false);
    const [selectedRole, setSelectedRole] = useState("Staff");

    useEffect(() => {
        if (state?.success) {
            // Ideally redirect to a list, but if we don't have one, just refresh or clear
            // router.push('/school/staff'); 
            // For now, let's just show success
            setPending(false);
            alert("Staff added successfully!"); // Temporary feedback
        } else if (state?.message) {
            setPending(false);
        }
    }, [state?.success, state?.message]);

    return (
        <form action={(formData) => {
            setPending(true);
            // Append the helper userRole if Finance is selected
            if (selectedRole === 'Finance') {
                formData.append('userRole', 'Finance');
                formData.set('role', 'Finance Clerk'); // Set job title
            } else {
                // For normal staff, just use the role input or default
            }
            formAction(formData);
        }}>
            <div className="grid gap-6 max-w-2xl mx-auto">
                <Card className="border-border">
                    <CardHeader>
                        <CardTitle>Add New Staff Member</CardTitle>
                        <CardDescription>Create a profile for non-teaching staff (Clerks, Admins, etc).</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" name="name" required />
                            {state?.errors?.name && <p className="text-red-500 text-xs">{state.errors.name}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="fatherName">Father Name</Label>
                            <Input id="fatherName" name="fatherName" required />
                            {state?.errors?.fatherName && <p className="text-red-500 text-xs">{state.errors.fatherName}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="cnic">CNIC</Label>
                            <Input id="cnic" name="cnic" placeholder="12345-1234567-1" required />
                            {state?.errors?.cnic && <p className="text-red-500 text-xs">{state.errors.cnic}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="dateOfBirth">Date of Birth</Label>
                            <Input id="dateOfBirth" name="dateOfBirth" type="date" required />
                            {state?.errors?.dateOfBirth && <p className="text-red-500 text-xs">{state.errors.dateOfBirth}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="contact">Contact Number</Label>
                            <Input id="contact" name="contact" placeholder="0300-1234567" required />
                            {state?.errors?.contact && <p className="text-red-500 text-xs">{state.errors.contact}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="gender">Gender</Label>
                            <Select name="gender" defaultValue="Male" required>
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
                            <Label htmlFor="roleSelect">System Role</Label>
                            <Select
                                value={selectedRole}
                                onValueChange={(val) => setSelectedRole(val)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Staff">General Staff</SelectItem>
                                    <SelectItem value="Finance">Finance Clerk (Login Access)</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                {selectedRole === 'Finance'
                                    ? "Will create a login account with 'Finance' role."
                                    : "Standard staff profile without login access."}
                            </p>
                        </div>

                        {selectedRole !== 'Finance' && (
                            <div className="space-y-2">
                                <Label htmlFor="role">Job Title</Label>
                                <Input id="role" name="role" placeholder="e.g. Peon, Guard" required />
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="workingHours">Working Hours</Label>
                            <Input id="workingHours" name="workingHours" defaultValue="8:00 AM - 2:00 PM" required />
                        </div>
                    </CardContent>
                </Card>

                {state?.message && !state.success && (
                    <div className="p-4 bg-red-50 text-red-600 rounded-md">
                        {state.message}
                    </div>
                )}
                {state?.success && state?.message && (
                    <div className="p-4 bg-green-50 text-green-600 rounded-md">
                        {state.message}
                    </div>
                )}

                <div className="flex justify-end gap-4">
                    <Button type="submit" disabled={pending}>
                        {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Add Staff Member
                    </Button>
                </div>
            </div>
        </form>
    );
}
