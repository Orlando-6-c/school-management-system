'use client';

import { useActionState, useEffect, useState } from 'react';
import { createClass } from '@/actions/academics';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface Teacher {
    id: string;
    name: string;
}

export function CreateClassForm({ teachers }: { teachers: Teacher[] }) {
    const [state, action, pending] = useActionState(createClass, undefined);

    // Controlled fields preserve values on validation error; reset only on success
    const [section, setSection] = useState('');
    const [fee, setFee] = useState('0');
    const [gradeName, setGradeName] = useState('');
    const [teacherId, setTeacherId] = useState('');

    useEffect(() => {
        if (state?.success) {
            setSection('');
            setFee('0');
            setGradeName('');
            setTeacherId('');
        }
    }, [state?.success]);

    const inputClasses = 'bg-card text-foreground border-input focus:ring-gray-400 focus:border-gray-400';

    return (
        <Card className="bg-card shadow-sm border-border">
            <CardHeader>
                <CardTitle>Add New Class</CardTitle>
            </CardHeader>
            <CardContent>
                <form action={action} className="grid gap-4">
                    {state?.message && (
                        <div className={`text-sm p-2 rounded ${state.success ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'}`}>
                            {state.message}
                        </div>
                    )}

                    <div className="grid gap-2">
                        <Label htmlFor="name" className="text-muted-foreground">Class Name</Label>
                        <select
                            name="name"
                            value={gradeName}
                            onChange={(e) => setGradeName(e.target.value)}
                            className={`flex h-10 w-full rounded-md border border-input px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${inputClasses}`}
                            required
                        >
                            <option value="">Select Grade</option>
                            <option value="Play Group|0">Play Group</option>
                            <option value="Nursery|0">Nursery</option>
                            <option value="Prep|0">Prep</option>
                            <option value="Grade 1|1">Grade 1</option>
                            <option value="Grade 2|2">Grade 2</option>
                            <option value="Grade 3|3">Grade 3</option>
                            <option value="Grade 4|4">Grade 4</option>
                            <option value="Grade 5|5">Grade 5</option>
                            <option value="Grade 6|6">Grade 6</option>
                            <option value="Grade 7|7">Grade 7</option>
                            <option value="Grade 8|8">Grade 8</option>
                            <option value="Grade 9|9">Grade 9</option>
                            <option value="Grade 10|10">Grade 10</option>
                        </select>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="section" className="text-muted-foreground">Section (Optional)</Label>
                        <Input
                            name="section"
                            placeholder="e.g. A"
                            value={section}
                            onChange={(e) => setSection(e.target.value)}
                            className={inputClasses}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="monthlyTuitionFee" className="text-muted-foreground">Monthly Tuition Fee</Label>
                        <Input
                            name="monthlyTuitionFee"
                            type="number"
                            min="0"
                            required
                            value={fee}
                            onChange={(e) => setFee(e.target.value)}
                            className={inputClasses}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="classTeacherId" className="text-muted-foreground">Designated Teacher</Label>
                        <select
                            name="classTeacherId"
                            value={teacherId}
                            onChange={(e) => setTeacherId(e.target.value)}
                            className={`flex h-10 w-full rounded-md border border-input px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${inputClasses}`}
                        >
                            <option value="">Select Teacher</option>
                            {teachers.map((t) => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>

                    <Button type="submit" disabled={pending} className="w-full bg-primary hover:bg-primary text-white">
                        {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Create Class'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
