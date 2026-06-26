// src/components/finance/ExpenseForm.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ExpenseCategory } from '@prisma/client';
import { addExpense } from '@/actions/finance';
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
    category: z.nativeEnum(ExpenseCategory, { message: 'Invalid expense category' }),
    paidTo: z.string().min(1, 'Recipient is required'),
    paymentMethod: z.string().min(1, 'Payment method is required'),
    date: z.string().min(1, 'Date is required'), // Will be converted to Date object in action
    reference: z.string().optional().nullable(),
    remarks: z.string().optional().nullable(),
});

type ExpenseFormValues = z.infer<typeof formSchema>;

interface ExpenseFormProps {
    defaultValues?: Partial<ExpenseFormValues>;
}

export default function ExpenseForm({ defaultValues }: ExpenseFormProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const form = useForm<ExpenseFormValues>({
        resolver: zodResolver(formSchema) as Resolver<ExpenseFormValues>,
        defaultValues: {
            date: format(new Date(), 'yyyy-MM-dd'),
            reference: '',
            remarks: '',
            ...defaultValues,
        },
    });

    const { register, handleSubmit, control, setValue, formState: { errors } } = form;

    const onSubmit = async (data: ExpenseFormValues) => {
        setError(null);
        startTransition(async () => {
            const formData = new FormData();
            Object.entries(data).forEach(([key, value]) => {
                if (value !== null && value !== undefined) {
                    formData.append(key, value.toString());
                }
            });

            const result = await addExpense(undefined, formData);

            if (result.success) {
                router.push('/school/finance/expense');
                router.refresh();
            } else {
                setError(result.message || 'Failed to add expense.');
                // Handle field-specific errors if any
                if (result.errors) {
                    for (const key in result.errors) {
                        form.setError(key as keyof ExpenseFormValues, {
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
                        onValueChange={(value) => setValue('category', value as ExpenseCategory)}
                        defaultValue={form.getValues('category')}
                    >
                        <SelectTrigger className={cn({ 'border-red-500': errors.category })}>
                            <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.values(ExpenseCategory).map((category) => (
                                <SelectItem key={category} value={category}>
                                    {category}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.category && <p className="text-red-500 text-sm">{errors.category.message}</p>}
                </div>

                {/* Paid To */}
                <div className="space-y-2">
                    <Label htmlFor="paidTo">Paid To</Label>
                    <Input
                        id="paidTo"
                        {...register('paidTo')}
                        className={cn({ 'border-red-500': errors.paidTo })}
                    />
                    {errors.paidTo && <p className="text-red-500 text-sm">{errors.paidTo.message}</p>}
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
                {isPending ? 'Adding Expense...' : 'Add Expense'}
            </Button>
        </form>
    );
}
