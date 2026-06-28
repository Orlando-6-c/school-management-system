'use client';

import { useActionState, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { admitStudent, getGuardianByCNIC } from '@/actions/student';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Search } from 'lucide-react';
import { PhotoUpload } from '@/components/ui/photo-upload';

interface ClassItem {
    id: string;
    name: string;
    section?: string | null;
    monthlyTuitionFee: number;
}

interface AdmissionFormProps {
    classes: ClassItem[];
}

const initialState = {
    message: '',
    errors: {} as Record<string, string[]>,
    success: false,
};

export function AdmissionForm({ classes = [] }: AdmissionFormProps) { // Default to empty array
    const [state, action, isSubmitting] = useActionState(admitStudent, initialState);

    const { register, setValue, watch, formState: { errors } } = useForm({
        defaultValues: {
            guardianCnic: '',
            guardianName: '',
            guardianRelation: '',
            guardianContact: '',
            name: '',
            gender: 'Male',
            dateOfBirth: '',
            bFormNumber: '',
            classId: '',
            dateOfAdmission: new Date().toISOString().split('T')[0], // Default to today
            monthlyFees: 0,
            discountPercentage: 0,
            photograph: '' // kept for form registration; PhotoUpload manages actual value
        }
    });

    // Watch logic
    const selectedClassId = watch('classId');
    const monthlyFeeInput = watch('monthlyFees');
    const discountInput = watch('discountPercentage');

    // Local state
    const [finalFee, setFinalFee] = useState(0);
    const [cnicSearch, setCnicSearch] = useState('');
    const [searching, setSearching] = useState(false);
    const [guardianFound, setGuardianFound] = useState(false);

    // Auto-fill fee
    useEffect(() => {
        if (classes && selectedClassId) {
            const selectedClass = classes.find((c) => c.id === selectedClassId);
            if (selectedClass) {
                setValue('monthlyFees', selectedClass.monthlyTuitionFee);
            }
        }
    }, [selectedClassId, classes, setValue]);

    // Calculate final fee
    useEffect(() => {
        const fee = Number(monthlyFeeInput) || 0;
        const discount = Number(discountInput) || 0;
        const calculated = fee - fee * (discount / 100);
        setFinalFee(Math.round(calculated));
    }, [monthlyFeeInput, discountInput]);

    const handleCnicSearch = async () => {
        if (cnicSearch.length < 5) {
            alert('Please enter a valid CNIC');
            return;
        }
        setSearching(true);
        try {
            const guardian = await getGuardianByCNIC(cnicSearch);
            if (guardian) {
                setValue('guardianName', guardian.name);
                setValue('guardianRelation', guardian.relation);
                setValue('guardianContact', guardian.contact);
                setGuardianFound(true);
                alert('Guardian found! Linked successfully.');
            } else {
                setGuardianFound(false);
                alert('No existing guardian found. Please enter details.');
            }
        } catch (error) {
            console.error(error);
            alert('Error searching for guardian');
        } finally {
            setSearching(false);
        }
    };

    const inputClasses = "bg-card text-foreground border-input focus:ring-indigo-500 focus:border-indigo-500";
    const labelClasses = "text-muted-foreground font-medium";

    return (
        <form action={action} className="space-y-8">

            {state.message && (
                <div className={`p-4 rounded-md ${state.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {state.message}
                </div>
            )}

            <div className="grid gap-8 md:grid-cols-2">
                {/* Guardian Card */}
                <Card className="bg-card shadow-sm border-border">
                    <CardHeader><CardTitle className="text-foreground">Guardian Information</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-2 items-end">
                            <div className="grid gap-2 flex-1">
                                <Label htmlFor="guardianCnic" className={labelClasses}>CNIC</Label>
                                <Input
                                    id="guardianCnic"
                                    placeholder="12345..."
                                    required
                                    className={inputClasses}
                                    {...register("guardianCnic")}
                                    onChange={(e) => {
                                        register("guardianCnic").onChange(e);
                                        setCnicSearch(e.target.value);
                                        if (guardianFound) setGuardianFound(false);
                                    }}
                                />
                            </div>
                            <Button type="button" variant="outline" onClick={handleCnicSearch} disabled={searching} className="bg-card text-muted-foreground border-input">
                                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                            </Button>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="guardianName" className={labelClasses}>Name</Label>
                            <Input id="guardianName" required readOnly={guardianFound} className={guardianFound ? "bg-muted" : inputClasses} {...register("guardianName")} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="guardianRelation" className={labelClasses}>Relation</Label>
                            <Input id="guardianRelation" required readOnly={guardianFound} className={guardianFound ? "bg-muted" : inputClasses} {...register("guardianRelation")} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="guardianContact" className={labelClasses}>Contact</Label>
                            <Input id="guardianContact" required readOnly={guardianFound} className={guardianFound ? "bg-muted" : inputClasses} {...register("guardianContact")} />
                        </div>
                    </CardContent>
                </Card>

                {/* Student Card */}
                <Card className="bg-card shadow-sm border-border">
                    <CardHeader><CardTitle className="text-foreground">Student Information</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label className={labelClasses}>Photo</Label>
                            <PhotoUpload name="photograph" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="name" className={labelClasses}>Full Name</Label>
                            <Input id="name" required className={inputClasses} {...register("name")} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="gender" className={labelClasses}>Gender</Label>
                                <select className={`flex h-10 w-full rounded-md border border-input px-3 py-2 text-sm ${inputClasses}`} required {...register("gender")}>
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
                            <Label htmlFor="bFormNumber" className={labelClasses}>B-Form</Label>
                            <Input id="bFormNumber" required className={inputClasses} {...register("bFormNumber")} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="classId" className={labelClasses}>Class</Label>
                            <select className={`flex h-10 w-full rounded-md border border-input px-3 py-2 text-sm ${inputClasses}`} required {...register("classId", { required: true })}>
                                <option value="">Select Class</option>
                                {classes && classes.map((cls) => (
                                    <option key={cls.id} value={cls.id}>{cls.name} {cls.section ? `(${cls.section})` : ''}</option>
                                ))}
                            </select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="dateOfAdmission" className={labelClasses}>Admission Date</Label>
                            <Input id="dateOfAdmission" type="date" required className={inputClasses} {...register("dateOfAdmission")} />
                        </div>
                    </CardContent>
                </Card>

                {/* Financials Card */}
                <Card className="md:col-span-2 bg-card shadow-sm border-border">
                    <CardHeader><CardTitle className="text-foreground">Financials</CardTitle></CardHeader>
                    <CardContent className="grid md:grid-cols-3 gap-6">
                        <div className="grid gap-2">
                            <Label htmlFor="monthlyFees" className={labelClasses}>Monthly Fee</Label>
                            <Input id="monthlyFees" type="number" required className={inputClasses} {...register("monthlyFees", { valueAsNumber: true })} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="discountPercentage" className={labelClasses}>Discount (%)</Label>
                            <Input id="discountPercentage" type="number" min="0" max="100" required className={inputClasses} {...register("discountPercentage", { valueAsNumber: true })} />
                        </div>
                        <div className="grid gap-2">
                            <Label className={labelClasses}>Final Fee</Label>
                            <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted px-3 text-sm font-bold text-foreground">{finalFee}</div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div className="flex justify-end">
                <Button type="submit" size="lg" disabled={isSubmitting} className="bg-primary hover:bg-primary text-white">
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Admit Student'}
                </Button>
            </div>
        </form>
    );
}
