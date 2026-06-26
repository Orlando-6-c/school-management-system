'use client';

import { useActionState, useEffect, useState } from 'react';
import { updateStudent } from '@/actions/student';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

const initialState = {
    message: '',
    errors: {} as Record<string, string[]>,
    success: false,
};

export default function EditStudentForm({ student, classes }: { student: any; classes: any[] }) {
    const updateStudentWithId = updateStudent.bind(null, student.id);
    const [state, formAction, isPending] = useActionState(updateStudentWithId, initialState);

    // Controlled inputs — React 19 resets uncontrolled inputs after any form action completes
    const [form, setForm] = useState({
        guardianCnic: student.guardian?.cnic ?? '',
        guardianName: student.guardian?.name ?? '',
        guardianRelation: student.guardian?.relation ?? '',
        guardianContact: student.guardian?.contact ?? '',
        guardianEmail: student.guardian?.email ?? '',
        name: student.name ?? '',
        dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth).toISOString().split('T')[0] : '',
        bFormNumber: student.bFormNumber ?? '',
        dateOfAdmission: student.dateOfAdmission ? new Date(student.dateOfAdmission).toISOString().split('T')[0] : '',
        photograph: student.photograph ?? '',
        monthlyFees: student.monthlyFees?.toString() ?? '',
        discountPercentage: student.discountPercentage?.toString() ?? '0',
    });
    const [gender, setGender] = useState<string>(student.gender ?? 'Male');
    const [classId, setClassId] = useState<string>(student.classId ?? '');

    const field =
        (name: keyof typeof form) =>
        (e: React.ChangeEvent<HTMLInputElement>) =>
            setForm((prev) => ({ ...prev, [name]: e.target.value }));

    useEffect(() => {
        if (state?.success) {
            window.location.href = '/school/students';
        }
    }, [state?.success]);

    return (
        <form action={formAction} className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Guardian Information</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="guardianCnic">Guardian CNIC</Label>
                        <Input id="guardianCnic" name="guardianCnic" value={form.guardianCnic} onChange={field('guardianCnic')} required />
                        {state.errors?.guardianCnic && <p className="text-red-500 text-sm">{state.errors.guardianCnic}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="guardianName">Guardian Name</Label>
                        <Input id="guardianName" name="guardianName" value={form.guardianName} onChange={field('guardianName')} required />
                        {state.errors?.guardianName && <p className="text-red-500 text-sm">{state.errors.guardianName}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="guardianRelation">Relation</Label>
                        <Input id="guardianRelation" name="guardianRelation" value={form.guardianRelation} onChange={field('guardianRelation')} required />
                        {state.errors?.guardianRelation && <p className="text-red-500 text-sm">{state.errors.guardianRelation}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="guardianContact">Contact Number</Label>
                        <Input id="guardianContact" name="guardianContact" value={form.guardianContact} onChange={field('guardianContact')} required />
                        {state.errors?.guardianContact && <p className="text-red-500 text-sm">{state.errors.guardianContact}</p>}
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="guardianEmail">Email (Optional)</Label>
                        <Input id="guardianEmail" name="guardianEmail" type="email" value={form.guardianEmail} onChange={field('guardianEmail')} />
                        {state.errors?.guardianEmail && <p className="text-red-500 text-sm">{state.errors.guardianEmail}</p>}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Student Information</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" name="name" value={form.name} onChange={field('name')} required />
                        {state.errors?.name && <p className="text-red-500 text-sm">{state.errors.name}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="gender">Gender</Label>
                        <input type="hidden" name="gender" value={gender} />
                        <Select value={gender} onValueChange={setGender}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Male">Male</SelectItem>
                                <SelectItem value="Female">Female</SelectItem>
                            </SelectContent>
                        </Select>
                        {state.errors?.gender && <p className="text-red-500 text-sm">{state.errors.gender}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="dateOfBirth">Date of Birth</Label>
                        <Input id="dateOfBirth" name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={field('dateOfBirth')} required />
                        {state.errors?.dateOfBirth && <p className="text-red-500 text-sm">{state.errors.dateOfBirth}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="bFormNumber">B-Form / CNIC</Label>
                        <Input id="bFormNumber" name="bFormNumber" value={form.bFormNumber} onChange={field('bFormNumber')} required />
                        {state.errors?.bFormNumber && <p className="text-red-500 text-sm">{state.errors.bFormNumber}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="classId">Class</Label>
                        <input type="hidden" name="classId" value={classId} />
                        <Select value={classId} onValueChange={setClassId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a class" />
                            </SelectTrigger>
                            <SelectContent>
                                {classes.map((c) => (
                                    <SelectItem key={c.id} value={c.id}>
                                        {c.name} {c.section ? `(${c.section})` : ''}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {state.errors?.classId && <p className="text-red-500 text-sm">{state.errors.classId}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="dateOfAdmission">Date of Admission</Label>
                        <Input id="dateOfAdmission" name="dateOfAdmission" type="date" value={form.dateOfAdmission} onChange={field('dateOfAdmission')} required />
                        {state.errors?.dateOfAdmission && <p className="text-red-500 text-sm">{state.errors.dateOfAdmission}</p>}
                    </div>

                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="photograph">Photograph URL (Optional)</Label>
                        <Input id="photograph" name="photograph" value={form.photograph} onChange={field('photograph')} />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Financials</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="monthlyFees">Monthly Tuition Fee</Label>
                        <Input id="monthlyFees" name="monthlyFees" type="number" value={form.monthlyFees} onChange={field('monthlyFees')} required />
                        {state.errors?.monthlyFees && <p className="text-red-500 text-sm">{state.errors.monthlyFees}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="discountPercentage">Discount (%)</Label>
                        <Input id="discountPercentage" name="discountPercentage" type="number" value={form.discountPercentage} onChange={field('discountPercentage')} min="0" max="100" />
                        {state.errors?.discountPercentage && <p className="text-red-500 text-sm">{state.errors.discountPercentage}</p>}
                    </div>
                </CardContent>
            </Card>

            {state.message && (
                <div className={`p-4 rounded-md ${state.success ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'}`}>
                    {state.message}
                </div>
            )}

            <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" asChild>
                    <a href="/school/students">Cancel</a>
                </Button>
                <Button type="submit" disabled={isPending}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Update Student
                </Button>
            </div>
        </form>
    );
}
