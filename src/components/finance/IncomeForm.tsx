// src/components/finance/IncomeForm.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { IncomeCategory } from '@prisma/client';
import { addIncome } from '@/actions/finance';
import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils'; // Assuming cn utility is available
import { format } from 'date-fns';

// Form Schema
const formSchema = z.object({
    description: z.string().min(1, 'Description is required'),
    amount: z.coerce.number().min(0.01, 'Amount must be positive'),
    category: z.nativeEnum(IncomeCategory, { message: 'Invalid income category' }),
    source: z.string().min(1, 'Source is required'),
    paymentMethod: z.string().min(1, 'Payment method is required'),
    date: z.string().min(1, 'Date is required'), // Will be converted to Date object in action
    studentId: z.string().optional().nullable(),
    reference: z.string().optional().nullable(),
    remarks: z.string().optional().nullable(),
});

type IncomeFormValues = z.infer<typeof formSchema>;

interface IncomeFormProps {
    students: { id: string; name: string; rollNumber: string }[];
    defaultValues?: Partial<IncomeFormValues>;
}

export default function IncomeForm({ students, defaultValues }: IncomeFormProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const form = useForm<IncomeFormValues>({
        resolver: zodResolver(formSchema) as Resolver<IncomeFormValues>,
        defaultValues: {
            date: format(new Date(), 'yyyy-MM-dd'),
            studentId: '',
            reference: '',
            remarks: '',
            ...defaultValues,
        },
    });

    const { register, handleSubmit, control, setValue, formState: { errors } } = form;

    const onSubmit = async (data: IncomeFormValues) => {
        setError(null);
        startTransition(async () => {
            const formData = new FormData();
            Object.entries(data).forEach(([key, value]) => {
                if (value !== null && value !== undefined) {
                    formData.append(key, value.toString());
                }
            });

            const result = await addIncome(undefined, formData);

            if (result.success) {
                router.push('/school/finance/income');
                router.refresh();
            } else {
                setError(result.message || 'Failed to add income.');
                // Handle field-specific errors if any
                if (result.errors) {
                    for (const key in result.errors) {
                        form.setError(key as keyof IncomeFormValues, {
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
                {/* Date */}
                <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                        id="date"
                        type="date"
                        {...register('date')}
                        className={cn({ 'border-red-500': errors.date })}
                    />
                    {errors.date && <p className="text-red-500 text-sm">{errors.date.message}</p>}
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

                {/* Category */}
                <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                        onValueChange={(value) => setValue('category', value as IncomeCategory)}
                        defaultValue={form.getValues('category')}
                    >
                        <SelectTrigger className={cn({ 'border-red-500': errors.category })}>
                            <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.values(IncomeCategory).map((category) => (
                                <SelectItem key={category} value={category}>
                                    {category}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.category && <p className="text-red-500 text-sm">{errors.category.message}</p>}
                </div>

                {/* Source */}
                <div className="space-y-2">
                    <Label htmlFor="source">Source</Label>
                    <Input
                        id="source"
                        {...register('source')}
                        className={cn({ 'border-red-500': errors.source })}
                    />
                    {errors.source && <p className="text-red-500 text-sm">{errors.source.message}</p>}
                </div>

                {/* Payment Method */}
                <div className="space-y-2">
                    <Label htmlFor="paymentMethod">Payment Method</Label>
                    <Input
                        id="paymentMethod"
                        {...register('paymentMethod')}
                        className={cn({ 'border-red-500': errors.paymentMethod })}
                    />
                    {errors.paymentMethod && <p className="text-red-500 text-sm">{errors.paymentMethod.message}</p>}
                </div>

                {/* Student (Optional) */}
                <div className="space-y-2">
                    <Label htmlFor="studentId">Student (Optional)</Label>
                    <Select
                        onValueChange={(value) => setValue('studentId', value)}
                        defaultValue={form.getValues('studentId') || ''}
                    >
                        <SelectTrigger id="studentId" className={cn({ 'border-red-500': errors.studentId })}>
                            <SelectValue placeholder="Select Student" />
                        </SelectTrigger>
                        <SelectContent>
                            {students.map((student) => (
                                <SelectItem key={student.id} value={student.id}>
                                    {student.name} ({student.rollNumber})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.studentId && <p className="text-red-500 text-sm">{errors.studentId.message}</p>}
                </div>

                {/* Reference (Optional) */}
                <div className="space-y-2">
                    <Label htmlFor="reference">Reference (Optional)</Label>
                    <Input
                        id="reference"
                        {...register('reference')}
                        className={cn({ 'border-red-500': errors.reference })}
                    />
                    {errors.reference && <p className="text-red-500 text-sm">{errors.reference.message}</p>}
                </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                    id="description"
                    {...register('description')}
                    className={cn({ 'border-red-500': errors.description })}
                />
                {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
            </div>

            {/* Remarks (Optional) */}
            <div className="space-y-2">
                <Label htmlFor="remarks">Remarks (Optional)</Label>
                <Textarea
                    id="remarks"
                    {...register('remarks')}
                    className={cn({ 'border-red-500': errors.remarks })}
                />
                {errors.remarks && <p className="text-red-500 text-sm">{errors.remarks.message}</p>}
            </div>

            <Button type="submit" disabled={isPending}>
                {isPending ? 'Adding Income...' : 'Add Income'}
            </Button>
        </form>
    );
}
