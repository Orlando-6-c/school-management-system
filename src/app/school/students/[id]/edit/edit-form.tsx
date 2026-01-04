'use client';

import { useFormState } from 'react-dom';
import { updateStudent } from '@/actions/student';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect } from 'react';

const initialState = {
    message: '',
    errors: {} as Record<string, string[]>
};

export default function EditStudentForm({ student, classes }: { student: any, classes: any[] }) {
    const updateStudentWithId = updateStudent.bind(null, student.id);
    const [state, formAction] = useFormState(updateStudentWithId, initialState);

    useEffect(() => {
        if (state.message) {
            // console.log(state.message);
        }
    }, [state]);

    return (
        <form action={formAction} className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Guardian Information</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="guardianCnic">Guardian CNIC</Label>
                        <Input id="guardianCnic" name="guardianCnic" defaultValue={student.guardian.cnic} required />
                        {state.errors?.guardianCnic && <p className="text-red-500 text-sm">{state.errors.guardianCnic}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="guardianName">Guardian Name</Label>
                        <Input id="guardianName" name="guardianName" defaultValue={student.guardian.name} required />
                        {state.errors?.guardianName && <p className="text-red-500 text-sm">{state.errors.guardianName}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="guardianRelation">Relation</Label>
                        <Input id="guardianRelation" name="guardianRelation" defaultValue={student.guardian.relation} required />
                        {state.errors?.guardianRelation && <p className="text-red-500 text-sm">{state.errors.guardianRelation}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="guardianContact">Contact Number</Label>
                        <Input id="guardianContact" name="guardianContact" defaultValue={student.guardian.contact} required />
                        {state.errors?.guardianContact && <p className="text-red-500 text-sm">{state.errors.guardianContact}</p>}
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="guardianEmail">Email (Optional)</Label>
                        <Input id="guardianEmail" name="guardianEmail" type="email" defaultValue={student.guardian.email || ''} />
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
                        <Input id="name" name="name" defaultValue={student.name} required />
                        {state.errors?.name && <p className="text-red-500 text-sm">{state.errors.name}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="gender">Gender</Label>
                        <select
                            id="gender"
                            name="gender"
                            defaultValue={student.gender}
                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                        </select>
                        {state.errors?.gender && <p className="text-red-500 text-sm">{state.errors.gender}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="dateOfBirth">Date of Birth</Label>
                        <Input
                            id="dateOfBirth"
                            name="dateOfBirth"
                            type="date"
                            defaultValue={student.dateOfBirth ? new Date(student.dateOfBirth).toISOString().split('T')[0] : ''}
                            required
                        />
                        {state.errors?.dateOfBirth && <p className="text-red-500 text-sm">{state.errors.dateOfBirth}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="bFormNumber">B-Form / CNIC</Label>
                        <Input id="bFormNumber" name="bFormNumber" defaultValue={student.bFormNumber} required />
                        {state.errors?.bFormNumber && <p className="text-red-500 text-sm">{state.errors.bFormNumber}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="classId">Class</Label>
                        <select
                            id="classId"
                            name="classId"
                            defaultValue={student.classId}
                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {classes.map((c) => (
                                <option key={c.id} value={c.id}>{c.name} {c.section ? `(${c.section})` : ''}</option>
                            ))}
                        </select>
                        {state.errors?.classId && <p className="text-red-500 text-sm">{state.errors.classId}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="dateOfAdmission">Date of Admission</Label>
                        <Input
                            id="dateOfAdmission"
                            name="dateOfAdmission"
                            type="date"
                            defaultValue={student.dateOfAdmission ? new Date(student.dateOfAdmission).toISOString().split('T')[0] : ''}
                            required
                        />
                        {state.errors?.dateOfAdmission && <p className="text-red-500 text-sm">{state.errors.dateOfAdmission}</p>}
                    </div>

                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="photograph">Photograph URL (Optional)</Label>
                        <Input id="photograph" name="photograph" defaultValue={student.photograph || ''} />
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
                        <Input id="monthlyFees" name="monthlyFees" type="number" defaultValue={student.monthlyFees} required />
                        {state.errors?.monthlyFees && <p className="text-red-500 text-sm">{state.errors.monthlyFees}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="discountPercentage">Discount (%)</Label>
                        <Input id="discountPercentage" name="discountPercentage" type="number" defaultValue={student.discountPercentage} min="0" max="100" />
                        {state.errors?.discountPercentage && <p className="text-red-500 text-sm">{state.errors.discountPercentage}</p>}
                    </div>
                </CardContent>
            </Card>

            {state.message && (
                <div className={`p-4 rounded-md ${state.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {state.message}
                </div>
            )}

            <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" asChild>
                    <a href={`/school/students/${student.id}`}>Cancel</a>
                </Button>
                <Button type="submit">Update Student</Button>
            </div>
        </form>
    );
}
