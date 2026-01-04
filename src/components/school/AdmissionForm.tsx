'use client';

import { useActionState, useState, useEffect, useTransition } from 'react';
import { admitStudent } from '@/actions/student';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Search } from 'lucide-react';
import { useForm } from 'react-hook-form';

interface ClassItem {
    id: string;
    name: string;
    section: string | null;
}

const HARDCODED_CLASSES = [
    "Play Group", "Nursery", "Prep",
    "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5",
    "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10"
];

interface FormValues {
    guardianCnic: string;
    guardianName: string;
    guardianRelation: string;
    guardianContact: string;
    name: string;
    gender: "Male" | "Female";
    dateOfBirth: string;
    bFormNumber: string;
    classId: string;
    dateOfAdmission: string;
    annualFee: number;
    discountPercentage: number;
}

export function AdmissionForm({ classes }: { classes: ClassItem[] }) {
    // Keep using useActionState for form submission handling
    const [state, action] = useActionState(admitStudent, undefined);
    const { register, watch, handleSubmit, formState: { isSubmitting } } = useForm<FormValues>({
        defaultValues: {
            dateOfAdmission: new Date().toISOString().split('T')[0],
            annualFee: 0,
            discountPercentage: 0,
            gender: "Male" // Default
        }
    });

    // Fee Calculation using Watch
    const annualFee = watch("annualFee");
    const discount = watch("discountPercentage");
    const [finalFee, setFinalFee] = useState<number>(0);

    const [cnicSearch, setCnicSearch] = useState('');
    const [guardianFound, setGuardianFound] = useState(false);
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        const fee = Number(annualFee) || 0;
        const disc = Number(discount) || 0;
        const calculated = fee * (1 - disc / 100);
        setFinalFee(Math.round(calculated));
    }, [annualFee, discount]);

    const handleCnicSearch = async () => {
        alert('Sibling search functionality coming in next update. Please fill details manually.');
    };

    const inputClasses = "bg-white text-gray-900 border-gray-300 focus:ring-gray-400 focus:border-gray-400";
    const labelClasses = "text-gray-700 font-medium";

    // Since we are using react-hook-form but also a server action, 
    // we need to bridge them. 
    // Ideally, the form action attribute handles it, but react-hook-form wants handleSubmit.
    // However, we can use the form action directly and register inputs ensuring 'name' props are set.
    // React Hook Form 'register' sets 'name'.
    // SO: <form action={action}> + {...register('fieldName')} works fine for simple cases.
    // But validation? Client side validation with RHF?
    // User requested: "Enable editing... use react-hook-form registration correctly."
    // And "Auto-Calculation: Use watch()."

    // We will use standard form submission via 'action={action}' for the Server Action.
    // We will use RHF only for the controlled inputs (fees) and watching them.
    // 'register' attaches refs and onChange.

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
                                    placeholder="12345-1234567-1"
                                    required
                                    className={inputClasses}
                                    {...register("guardianCnic")}
                                    onChange={(e) => {
                                        register("guardianCnic").onChange(e);
                                        setCnicSearch(e.target.value);
                                    }}
                                />
                            </div>
                            <Button type="button" variant="outline" onClick={handleCnicSearch} className="bg-white text-gray-700 border-gray-300">
                                <Search className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="guardianName" className={labelClasses}>Name</Label>
                            <Input id="guardianName" required disabled={guardianFound} className={inputClasses} {...register("guardianName")} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="guardianRelation" className={labelClasses}>Relation</Label>
                            <Input id="guardianRelation" placeholder="Father" required disabled={guardianFound} className={inputClasses} {...register("guardianRelation")} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="guardianContact" className={labelClasses}>Contact Number</Label>
                            <Input id="guardianContact" required disabled={guardianFound} className={inputClasses} {...register("guardianContact")} />
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
                            <Input id="name" required className={inputClasses} {...register("name")} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="gender" className={labelClasses}>Gender</Label>
                                <select
                                    className={`flex h-10 w-full rounded-md border border-input px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${inputClasses}`}
                                    required
                                    {...register("gender")}
                                >
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="dateOfBirth" className={labelClasses}>Date of Birth</Label>
                                <Input id="dateOfBirth" type="date" required className={inputClasses} {...register("dateOfBirth")} />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="bFormNumber" className={labelClasses}>B-Form Number</Label>
                            <Input id="bFormNumber" required className={inputClasses} {...register("bFormNumber")} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="classId" className={labelClasses}>Class</Label>
                            <select
                                className={`flex h-10 w-full rounded-md border border-input px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${inputClasses}`}
                                required
                                {...register("classId", { required: true })}
                            >
                                <option value="">Select Class</option>
                                {HARDCODED_CLASSES.map((clsName) => (
                                    <option key={clsName} value={
                                        // Attempt to find ID, else use Name (backend handled)
                                        classes.find(c => c.name === clsName)?.id || clsName
                                    }>
                                        {clsName}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="dateOfAdmission" className={labelClasses}>Date of Admission</Label>
                            <Input
                                id="dateOfAdmission"
                                type="date"
                                required
                                className={inputClasses}
                                {...register("dateOfAdmission")}
                            />
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
                                type="number"
                                min="0"
                                required
                                className={inputClasses}
                                {...register("annualFee", { valueAsNumber: true })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="discountPercentage" className={labelClasses}>Discount (%)</Label>
                            <Input
                                id="discountPercentage"
                                type="number"
                                min="0"
                                max="100"
                                required
                                className={inputClasses}
                                {...register("discountPercentage", { valueAsNumber: true })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label className={labelClasses}>Final Fee (Auto-Calculated)</Label>
                            <div className="flex h-10 w-full items-center rounded-md border border-gray-300 bg-gray-50 px-3 text-sm font-semibold text-gray-900">
                                {finalFee}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-end">
                <Button type="submit" size="lg" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    {isSubmitting ? (
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
