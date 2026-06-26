// src/components/finance/AdditionalChargeForm.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChargeType, IncomeCategory } from '@prisma/client';
import { addAdditionalCharge } from '@/actions/finance';
import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea'; // Assuming Textarea is used for remarks/description
import { cn } from '@/lib/utils'; // Assuming cn utility is available
import { Checkbox } from '@/components/ui/checkbox';


const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

// Form Schema
const formSchema = z.object({
    name: z.string().min(1, 'Charge name is required'),
    type: z.nativeEnum(ChargeType, { message: 'Invalid charge type' }),
    amount: z.coerce.number().min(0.01, 'Amount must be positive'),
    applicableMonths: z.array(z.string()).optional(), // Array of month names
    incomeCategory: z.nativeEnum(IncomeCategory, { message: 'Invalid income category' }),
    studentId: z.string().optional().nullable(),
    classId: z.string().optional().nullable(),
});

type AdditionalChargeFormValues = z.infer<typeof formSchema>;

interface AdditionalChargeFormProps {
    students: { id: string; name: string; rollNumber: string }[];
    classes: { id: string; name: string; section: string | null }[];
    defaultValues?: Partial<AdditionalChargeFormValues>;
}

export default function AdditionalChargeForm({ students, classes, defaultValues }: AdditionalChargeFormProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const form = useForm<AdditionalChargeFormValues>({
        resolver: zodResolver(formSchema) as Resolver<AdditionalChargeFormValues>,
        defaultValues: {
            applicableMonths: [],
            studentId: '',
            classId: '',
            ...defaultValues,
        },
    });

    const { register, handleSubmit, control, setValue, watch, formState: { errors } } = form;
    const chargeType = watch('type');
    const selectedStudentId = watch('studentId');
    const selectedClassId = watch('classId');

    const onSubmit = async (data: AdditionalChargeFormValues) => {
        setError(null);
        startTransition(async () => {
            const formData = new FormData();
            Object.entries(data).forEach(([key, value]) => {
                if (key === 'applicableMonths' && Array.isArray(value)) {
                    value.forEach(month => formData.append(key, month));
                } else if (value !== null && value !== undefined) {
                    formData.append(key, value.toString());
                }
            });

            const result = await addAdditionalCharge(undefined, formData);

            if (result.success) {
                router.push('/school/finance/charges');
                router.refresh();
            } else {
                setError(result.message || 'Failed to add additional charge.');
                // Handle field-specific errors if any
                if (result.errors) {
                    for (const key in result.errors) {
                        form.setError(key as keyof AdditionalChargeFormValues, {
                            type: 'server',
                            message: result.errors[key]?.[0],
                        });
                    }
                }
            }
        });
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && <p className="text-red-500 text-sm">{error}</p>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div className="space-y-2">
                    <Label htmlFor="name">Charge Name</Label>
                    <Input
                        id="name"
                        {...register('name')}
                        className={cn({ 'border-red-500': errors.name })}
                    />
                    {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
                </div>

                {/* Amount */}
                <div className="space-y-2">
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        {...register('amount')}
                        className={cn({ 'border-red-500': errors.amount })}
                    />
                    {errors.amount && <p className="text-red-500 text-sm">{errors.amount.message}</p>}
                </div>

                {/* Type */}
                <div className="space-y-2">
                    <Label htmlFor="type">Charge Type</Label>
                    <Select
                        onValueChange={(value) => setValue('type', value as ChargeType)}
                        defaultValue={form.getValues('type')}
                    >
                        <SelectTrigger className={cn({ 'border-red-500': errors.type })}>
                            <SelectValue placeholder="Select Type" />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.values(ChargeType).map((type) => (
                                <SelectItem key={type} value={type}>
                                    {type === 'OneTime' ? 'One-Time' : 'Recurring'}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.type && <p className="text-red-500 text-sm">{errors.type.message}</p>}
                </div>

                {/* Income Category */}
                <div className="space-y-2">
                    <Label htmlFor="incomeCategory">Income Category</Label>
                    <Select
                        onValueChange={(value) => setValue('incomeCategory', value as IncomeCategory)}
                        defaultValue={form.getValues('incomeCategory')}
                    >
                        <SelectTrigger className={cn({ 'border-red-500': errors.incomeCategory })}>
                            <SelectValue placeholder="Select Income Category" />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.values(IncomeCategory).map((category) => (
                                <SelectItem key={category} value={category}>
                                    {category}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.incomeCategory && <p className="text-red-500 text-sm">{errors.incomeCategory.message}</p>}
                </div>

                {/* Student (Optional) */}
                <div className="space-y-2">
                    <Label htmlFor="studentId">Apply to Specific Student (Optional)</Label>
                    <Select
                        onValueChange={(value) => {
                            setValue('studentId', value);
                            if (value) setValue('classId', ''); // Cannot select both
                        }}
                        value={selectedStudentId || ''}
                    >
                        <SelectTrigger id="studentId" className={cn({ 'border-red-500': errors.studentId })} disabled={!!selectedClassId}>
                            <SelectValue placeholder="Select Student" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">-- None --</SelectItem>
                            {students.map((student) => (
                                <SelectItem key={student.id} value={student.id}>
                                    {student.name} ({student.rollNumber})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.studentId && <p className="text-red-500 text-sm">{errors.studentId.message}</p>}
                </div>

                {/* Class (Optional) */}
                <div className="space-y-2">
                    <Label htmlFor="classId">Apply to Specific Class (Optional)</Label>
                    <Select
                        onValueChange={(value) => {
                            setValue('classId', value);
                            if (value) setValue('studentId', ''); // Cannot select both
                        }}
                        value={selectedClassId || ''}
                    >
                        <SelectTrigger id="classId" className={cn({ 'border-red-500': errors.classId })} disabled={!!selectedStudentId}>
                            <SelectValue placeholder="Select Class" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">-- None --</SelectItem>
                            {classes.map((klass) => (
                                <SelectItem key={klass.id} value={klass.id}>
                                    {klass.name} {klass.section ? `(${klass.section})` : ''}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.classId && <p className="text-red-500 text-sm">{errors.classId.message}</p>}
                </div>
            </div>

            {/* Applicable Months for Recurring Charges */}
            {chargeType === 'Recurring' && (
                <div className="space-y-2">
                    <Label>Applicable Months (Select all that apply)</Label>
                    <div className="grid grid-cols-3 gap-2">
                        {months.map((month) => (
                            <div key={month} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`month-${month}`}
                                    {...register('applicableMonths', {
                                        setValueAs: (value: string[]) => value && value.length > 0 ? value : undefined // Ensure undefined if empty
                                    })}
                                    value={month}
                                />
                                <label
                                    htmlFor={`month-${month}`}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    {month}
                                </label>
                            </div>
                        ))}
                    </div>
                    {errors.applicableMonths && <p className="text-red-500 text-sm">{errors.applicableMonths.message}</p>}
                </div>
            )}


            <Button type="submit" disabled={isPending}>
                {isPending ? 'Adding Charge...' : 'Add Additional Charge'}
            </Button>
        </form>
    );
}
