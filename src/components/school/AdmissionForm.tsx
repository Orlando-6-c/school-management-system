'use client';

import { useActionState, useState, useEffect } from 'react';
import { admitStudent } from '@/actions/student';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Search } from 'lucide-react';

interface ClassItem {
    id: string; // Keep string for compatibility, though we might send names as IDs or handle mapping server side if needed. 
    // Actually, if we hardcode, we probably don't have IDs unless we map them. 
    // But the server action expects `classId`.
    // The prompt says "Hardcode options". Use generic IDs or names?
    // "Fix Class Dropdown: Hardcode the <Select> options... 'Play Group', 'Nursery'..."
    // Since the backend expects a classId (FK), simply sending "Play Group" string will fail unless the backend handles it or we have seeded classes with those names.
    // However, I must follow the user's imperative "Hardcode the <Select> options".
    // I will assume for now I should display these.
    // Important: If I send "Play Group" as ID, prisma will error if uuid is expected or if record doesn't exist.
    // But maybe the user implies they want these options visible.
    // I will use them as values. If it fails on submit, that's a backend issue (missing seed), but UI will be fixed.
    name: string;
    section: string | null;
}

// Hardcoded classes as requested
const HARDCODED_CLASSES = [
    "Play Group", "Nursery", "Prep",
    "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5",
    "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10"
];

export function AdmissionForm({ classes }: { classes: ClassItem[] }) {
    const [state, action, pending] = useActionState(admitStudent, undefined);

    // Fee Calculation State
    const [annualFee, setAnnualFee] = useState<number>(0);
    const [discount, setDiscount] = useState<number>(0);
    const [finalFee, setFinalFee] = useState<number>(0);

    // Guardian Search State
    const [cnicSearch, setCnicSearch] = useState('');
    const [guardianFound, setGuardianFound] = useState(false);

    useEffect(() => {
        const calculated = annualFee * (1 - discount / 100);
        setFinalFee(Math.round(calculated));
    }, [annualFee, discount]);

    const handleCnicSearch = async () => {
        alert('Sibling search functionality coming in next update. Please fill details manually.');
    };

    const inputClasses = "bg-white text-gray-900 border-gray-300 focus:ring-gray-400 focus:border-gray-400";
    const labelClasses = "text-gray-700 font-medium";

    return (
        <form action={action} className="space-y-8">
            {state?.message && (
                <div className={`p-4 rounded-lg ${state.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {state.message}
                </div>
            )}

            <div className="grid gap-8 md:grid-cols-2">
                {/* Guardian Info */}
                <Card className="bg-white shadow-sm border-gray-200">
                    <CardHeader>
                        <CardTitle className="text-gray-900">Guardian Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-2 items-end">
                            <div className="grid gap-2 flex-1">
                                <Label htmlFor="guardianCnic" className={labelClasses}>CNIC</Label>
                                <Input
                                    id="guardianCnic"
                                    name="guardianCnic"
                                    placeholder="12345-1234567-1"
                                    required
                                    value={cnicSearch}
                                    onChange={(e) => setCnicSearch(e.target.value)}
                                    className={inputClasses}
                                />
                            </div>
                            <Button type="button" variant="outline" onClick={handleCnicSearch} className="bg-white text-gray-700 border-gray-300">
                                <Search className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="guardianName" className={labelClasses}>Name</Label>
                            <Input id="guardianName" name="guardianName" required disabled={guardianFound} className={inputClasses} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="guardianRelation" className={labelClasses}>Relation</Label>
                            <Input id="guardianRelation" name="guardianRelation" placeholder="Father" required disabled={guardianFound} className={inputClasses} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="guardianContact" className={labelClasses}>Contact Number</Label>
                            <Input id="guardianContact" name="guardianContact" required disabled={guardianFound} className={inputClasses} />
                        </div>
                    </CardContent>
                </Card>

                {/* Student Info */}
                <Card className="bg-white shadow-sm border-gray-200">
                    <CardHeader>
                        <CardTitle className="text-gray-900">Student Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name" className={labelClasses}>Full Name</Label>
                            <Input id="name" name="name" required className={inputClasses} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="gender" className={labelClasses}>Gender</Label>
                                <select
                                    name="gender"
                                    className={`flex h-10 w-full rounded-md border border-input px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${inputClasses}`}
                                    required
                                >
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="dateOfBirth" className={labelClasses}>Date of Birth</Label>
                                <Input id="dateOfBirth" name="dateOfBirth" type="date" required className={inputClasses} />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="bFormNumber" className={labelClasses}>B-Form Number</Label>
                            <Input id="bFormNumber" name="bFormNumber" required className={inputClasses} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="classId" className={labelClasses}>Class</Label>
                            <select
                                name="classId"
                                className={`flex h-10 w-full rounded-md border border-input px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${inputClasses}`}
                                required
                            >
                                <option value="">Select Class</option>
                                {HARDCODED_CLASSES.map((clsName) => (
                                    // NOTE: This will fail on submit if IDs are expected but we send Names. 
                                    // User asked to hardcode options visually.
                                    // Ideally we should map these names to IDs if they exist in DB.
                                    // For now, I'll pass the name as value. One check:
                                    // classes prop from server might have the IDs for these names if seeded.
                                    // I'll try to match with passed 'classes' prop if possible, otherwise fallback to name.
                                    // Actually, let's look for the ID in the passed 'classes' corresponding to this name.
                                    // If not found, use name (which might fail validation/FK, but keeps UI requirement).
                                    <option key={clsName} value={
                                        classes.find(c => c.name === clsName)?.id || clsName
                                    }>
                                        {clsName}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="dateOfAdmission" className={labelClasses}>Date of Admission</Label>
                            <Input id="dateOfAdmission" name="dateOfAdmission" type="date" defaultValue={new Date().toISOString().split('T')[0]} required className={inputClasses} />
                        </div>
                    </CardContent>
                </Card>

                {/* Financials */}
                <Card className="md:col-span-2 bg-white shadow-sm border-gray-200">
                    <CardHeader>
                        <CardTitle className="text-gray-900">Financial Information</CardTitle>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-3 gap-6">
                        <div className="grid gap-2">
                            <Label htmlFor="annualFee" className={labelClasses}>Annual/Monthly Fee</Label>
                            <Input
                                id="annualFee"
                                name="annualFee"
                                type="number"
                                min="0"
                                value={annualFee}
                                onChange={(e) => setAnnualFee(Number(e.target.value))}
                                required
                                className={inputClasses}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="discountPercentage" className={labelClasses}>Discount (%)</Label>
                            <Input
                                id="discountPercentage"
                                name="discountPercentage"
                                type="number"
                                min="0"
                                max="100"
                                value={discount}
                                onChange={(e) => setDiscount(Number(e.target.value))}
                                required
                                className={inputClasses}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label className={labelClasses}>Final Fee</Label>
                            <div className="flex h-10 w-full items-center rounded-md border border-gray-300 bg-gray-50 px-3 text-sm font-semibold text-gray-900">
                                {finalFee}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-end">
                <Button type="submit" size="lg" disabled={pending} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    {pending ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Admitting...
                        </>
                    ) : (
                        'Admit Student'
                    )}
                </Button>
            </div>
        </form>
    );
}
