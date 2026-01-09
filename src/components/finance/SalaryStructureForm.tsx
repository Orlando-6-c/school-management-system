// src/components/finance/SalaryStructureForm.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { addSalaryStructure, updateSalaryStructure } from '@/actions/finance';
import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils'; // Assuming cn utility is available

// Form Schema
const formSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    baseSalary: z.coerce.number().min(0, 'Base Salary must be positive'),
    allowances: z.coerce.number().min(0, 'Allowances must be positive').optional().default(0),
    deductions: z.coerce.number().min(0, 'Deductions must be positive').optional().default(0),
});

type SalaryStructureFormValues = z.infer<typeof formSchema>;

interface SalaryStructureFormProps {
    id?: string; // Optional ID for editing
    defaultValues?: Partial<SalaryStructureFormValues>;
}

export default function SalaryStructureForm({ id, defaultValues }: SalaryStructureFormProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const form = useForm<SalaryStructureFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            allowances: 0,
            deductions: 0,
            ...defaultValues,
        },
    });

    const { register, handleSubmit, formState: { errors } } = form;

    const onSubmit = async (data: SalaryStructureFormValues) => {
        setError(null);
        startTransition(async () => {
            const formData = new FormData();
            Object.entries(data).forEach(([key, value]) => {
                if (value !== null && value !== undefined) {
                    formData.append(key, value.toString());
                }
            });

            const action = id ? updateSalaryStructure.bind(null, id) : addSalaryStructure;
            const result = await action(undefined, formData);

            if (result.success) {
                router.push('/school/finance/salary-structures');
                router.refresh();
            } else {
                setError(result.message || 'Failed to save salary structure.');
                // Handle field-specific errors if any
                if (result.errors) {
                    for (const key in result.errors) {
                        form.setError(key as keyof SalaryStructureFormValues, {
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
                    <Label htmlFor="name">Structure Name</Label>
                    <Input
                        id="name"
                        {...register('name')}
                        className={cn({ 'border-red-500': errors.name })}
                    />
                    {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
                </div>

                {/* Base Salary */}
                <div className="space-y-2">
                    <Label htmlFor="baseSalary">Base Salary</Label>
                    <Input
                        id="baseSalary"
                        type="number"
                        step="0.01"
                        {...register('baseSalary')}
                        className={cn({ 'border-red-500': errors.baseSalary })}
                    />
                    {errors.baseSalary && <p className="text-red-500 text-sm">{errors.baseSalary.message}</p>}
                </div>

                {/* Allowances */}
                <div className="space-y-2">
                    <Label htmlFor="allowances">Allowances</Label>
                    <Input
                        id="allowances"
                        type="number"
                        step="0.01"
                        {...register('allowances')}
                        className={cn({ 'border-red-500': errors.allowances })}
                    />
                    {errors.allowances && <p className="text-red-500 text-sm">{errors.allowances.message}</p>}
                </div>

                {/* Deductions */}
                <div className="space-y-2">
                    <Label htmlFor="deductions">Deductions</Label>
                    <Input
                        id="deductions"
                        type="number"
                        step="0.01"
                        {...register('deductions')}
                        className={cn({ 'border-red-500': errors.deductions })}
                    />
                    {errors.deductions && <p className="text-red-500 text-sm">{errors.deductions.message}</p>}
                </div>
            </div>

            <Button type="submit" disabled={isPending}>
                {isPending ? (id ? 'Updating...' : 'Adding...') : (id ? 'Update Structure' : 'Add Structure')}
            </Button>
        </form>
    );
}
