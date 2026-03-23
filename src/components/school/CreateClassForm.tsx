'use client';

import { useActionState, useEffect, useRef } from 'react';
import { createClass } from '@/actions/academics'; // Reusing action
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
    const formRef = useRef<HTMLFormElement>(null);
    const [state, action, pending] = useActionState(createClass, undefined);

    useEffect(() => {
        if (state?.success) {
            formRef.current?.reset();
        }
    }, [state]);

    // Simple inline form
    const inputClasses = "bg-card text-foreground border-input focus:ring-gray-400 focus:border-gray-400";

    return (
        <Card className="bg-card shadow-sm border-border">
            <CardHeader>
                <CardTitle>Add New Class</CardTitle>
            </CardHeader>
            <CardContent>
                <form ref={formRef} action={action} className="grid gap-4">
                    {state?.message && (
                        <div className={`text-sm p-2 rounded ${state.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {state.message}
                        </div>
                    )}

                    <div className="grid gap-2">
                        <Label htmlFor="name" className="text-muted-foreground">Class Name</Label>
                        <select
                            name="name"
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
                        <Input name="section" placeholder="e.g. A" className={inputClasses} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="monthlyTuitionFee" className="text-muted-foreground">Monthly Tuition Fee</Label>
                        {/* Input type number, min 0 */}
                        <Input name="monthlyTuitionFee" type="number" min="0" required defaultValue="0" className={inputClasses} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="classTeacherId" className="text-muted-foreground">Designated Teacher</Label>
                        <select
                            name="classTeacherId"
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
