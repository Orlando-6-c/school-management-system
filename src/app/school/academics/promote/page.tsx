import db from '@/lib/db';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { promoteStudents } from '@/actions/academics';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

async function handlePromotion(formData: FormData) {
    'use server';
    await promoteStudents(formData);
}

export default async function PromoteStudentsPage() {
    const session = await getSession();
    if (!session.schoolId) redirect('/login');

    const classes = await db.class.findMany({
        where: { schoolId: session.schoolId, isActive: true },
        orderBy: { gradeLevel: 'asc' }
    });

    return (
        <div className="container mx-auto py-10 max-w-2xl">
            <Card className="border-border shadow-sm">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold">Promote Students</CardTitle>
                    <CardDescription>
                        Bulk move all students from one class to another at the end of an academic term.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={handlePromotion} className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="fromClassId">Promote From (Source Class)</Label>
                                <Select name="fromClassId" required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select current class" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {classes.map((c) => (
                                            <SelectItem key={c.id} value={c.id}>
                                                {c.name} {c.section ? `(${c.section})` : ''}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="toClassId">Promote To (Target Class)</Label>
                                <Select name="toClassId" required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select target class" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {classes.map((c) => (
                                            <SelectItem key={c.id} value={c.id}>
                                                {c.name} {c.section ? `(${c.section})` : ''}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="pt-4">
                            <Button type="submit" className="w-full">
                                Promote All Students
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
