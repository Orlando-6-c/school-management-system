'use client';

import { useActionState, useState, useEffect, useTransition } from 'react';
import { admitStudent, getGuardianByCNIC } from '@/actions/student';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Search, Upload } from 'lucide-react';
import { useForm } from 'react-hook-form';

const [searching, setSearching] = useState(false);
const [guardianFound, setGuardianFound] = useState(false);

// Auto-Fill Logic
const selectedClassId = watch("classId");

useEffect(() => {
    if (selectedClassId) {
        const selectedClass = classes.find(c => c.id === selectedClassId || c.name === selectedClassId);
        if (selectedClass) {
            setValue("monthlyFees", Number(selectedClass.monthlyTuitionFee));
        }
    }
}, [selectedClassId, classes, setValue]);

// Fee Calculation
const monthlyFees = watch("monthlyFees");
const discount = watch("discountPercentage");
const [finalFee, setFinalFee] = useState<number>(0);
const [cnicSearch, setCnicSearch] = useState('');

useEffect(() => {
    const fee = Number(monthlyFees) || 0;
    const disc = Number(discount) || 0;
    const calculated = fee * (1 - disc / 100);
    setFinalFee(Math.round(calculated));
}, [monthlyFees, discount]);

const handleCnicSearch = async () => {
    const cnic = watch("guardianCnic");
    if (!cnic || cnic.length < 13) {
        alert("Invalid CNIC: Please enter a valid 13-digit CNIC to search.");
        return;
    }

    setSearching(true);
    try {
        const guardian = await getGuardianByCNIC(cnic);
        if (guardian) {
            setValue("guardianName", guardian.name);
            setValue("guardianRelation", guardian.relation);
            setValue("guardianContact", guardian.contact);
            if (guardian.email) setValue("guardianEmail", guardian.email);

            setGuardianFound(true);
            alert("Guardian Found! Sibling linking active. Guardian details auto-filled.");
        } else {
            setGuardianFound(false);
            alert("No Guardian Found: No existing records found for this CNIC. Please fill details manually.");
        }
    } catch (error) {
        console.error("Search error", error);
        alert("Search Failed: Could not fetch guardian details. Try again.");
    } finally {
        setSearching(false);
    }
};

const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        if (file.size > 1024 * 1024 * 2) { // 2MB Limit
            alert("File too large: Image size should be less than 2MB");
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            setValue("photograph", base64String);
        };
        reader.readAsDataURL(file);
    }
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

        {/* Hidden field for photograph base64 */}
        <input type="hidden" {...register("photograph")} />

        <div className="grid gap-8 md:grid-cols-2">
            {/* Guardian Info */}
            <Card className="bg-white shadow-sm border-gray-200">
                <CardHeader>
                    <CardTitle className="text-gray-900">Guardian Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2 items-end">
                        <div className="grid gap-2 flex-1">
                            <Label htmlFor="guardianCnic" className={labelClasses}>CNIC (without dashes)</Label>
                            <Input
                                id="guardianCnic"
                                placeholder="1234512345671"
                                required
                                className={inputClasses}
                                {...register("guardianCnic")}
                                onChange={(e) => {
                                    register("guardianCnic").onChange(e);
                                    setCnicSearch(e.target.value);
                                    if (guardianFound) setGuardianFound(false); // Reset if changed
                                }}
                            />
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleCnicSearch}
                            disabled={searching}
                            className="bg-white text-gray-700 border-gray-300"
                        >
                            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        </Button>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="guardianName" className={labelClasses}>Name</Label>
                        <Input id="guardianName" required readOnly={guardianFound} className={guardianFound ? "bg-gray-50" : inputClasses} {...register("guardianName")} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="guardianRelation" className={labelClasses}>Relation</Label>
                        <Input id="guardianRelation" placeholder="Father" required readOnly={guardianFound} className={guardianFound ? "bg-gray-50" : inputClasses} {...register("guardianRelation")} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="guardianContact" className={labelClasses}>Contact Number</Label>
                        <Input id="guardianContact" required readOnly={guardianFound} className={guardianFound ? "bg-gray-50" : inputClasses} {...register("guardianContact")} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="guardianEmail" className={labelClasses}>Email (Optional)</Label>
                        <Input id="guardianEmail" type="email" readOnly={guardianFound} className={guardianFound ? "bg-gray-50" : inputClasses} {...register("guardianEmail")} />
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
                        <Label htmlFor="photograph" className={labelClasses}>Student Photograph</Label>
                        <div className="flex items-center gap-4">
                            <Input
                                id="photograph"
                                type="file"
                                accept="image/*"
                                className={`${inputClasses} file:bg-indigo-50 file:text-indigo-700 file:border-0 file:rounded-md file:px-2 file:py-1 file:mr-2 file:text-sm file:font-medium hover:file:bg-indigo-100`}
                                onChange={handleImageChange}
                            />
                        </div>
                        <p className="text-xs text-gray-400 underline decoration-indigo-300 decoration-wavy">Max 2 MB in size. Preview not shown.</p>
                    </div>

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
                            {classes.map((cls) => (
                                <option key={cls.id} value={cls.id}>
                                    {cls.name} {cls.section ? `(${cls.section})` : ''} - Fee: {Number(cls.monthlyTuitionFee)}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500">
                            Selecting a class will auto-fill the monthly fee.
                        </p>
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
                        <Label htmlFor="monthlyFees" className={labelClasses}>Monthly Tuition Fee</Label>
                        <Input
                            id="monthlyFees"
                            type="number"
                            min="0"
                            required
                            className={inputClasses}
                            {...register("monthlyFees", { valueAsNumber: true })}
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
