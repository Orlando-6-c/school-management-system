// src/components/finance/GenerateSalarySlipsForm.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { generateBulkSalarySlips } from '@/actions/finance';
import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils'; // Assuming cn utility is available
import { Checkbox } from '@/components/ui/checkbox';
import { format, getYear } from 'date-fns';
import { EmployeeRole } from '@prisma/client';

// Form Schema
const formSchema = z.object({
    month: z.string().min(1, 'Month is required'),
    year: z.coerce.number().min(2000, 'Year must be after 2000').max(getYear(new Date()) + 1, 'Year cannot be in the future'),
    paidAt: z.string().min(1, 'Paid Date is required'),
    selectedEmployeeIds: z.array(z.string()).min(1, 'Please select at least one employee.'),
});

type GenerateSalarySlipsFormValues = z.infer<typeof formSchema>;

interface EmployeeForSelection {
    id: string;
    name: string;
    type: EmployeeRole;
    hasSalaryStructure: boolean;
}

interface GenerateSalarySlipsFormProps {
    employees: EmployeeForSelection[];
}

const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

export default function GenerateSalarySlipsForm({ employees }: GenerateSalarySlipsFormProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const form = useForm<GenerateSalarySlipsFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            month: format(new Date(), 'MMMM'), // Current month
            year: getYear(new Date()), // Current year
            paidAt: format(new Date(), 'yyyy-MM-dd'), // Current date
            selectedEmployeeIds: [],
        },
    });

    const { register, handleSubmit, control, setValue, watch, formState: { errors } } = form;
    const selectedEmployeeIds = watch('selectedEmployeeIds');

    const onSubmit = async (data: GenerateSalarySlipsFormValues) => {
        setError(null);
        startTransition(async () => {
            const employeesToGenerate = employees.filter(emp => data.selectedEmployeeIds.includes(emp.id)).map(emp => ({
                employeeId: emp.id,
                employeeType: emp.type,
            }));

            if (employeesToGenerate.some(emp => !emp.employeeType)) {
                setError('Some selected employees have an invalid type.');
                return;
            }

            const result = await generateBulkSalarySlips(
                employeesToGenerate,
                data.month,
                data.year,
                new Date(data.paidAt)
            );

            if (result.success) {
                router.push('/school/finance/salary-slips');
                router.refresh();
            } else {
                setError(result.message || 'Failed to generate salary slips.');
                // Handle field-specific errors if any
                if (result.errors) {
                    for (const key in result.errors) {
                        form.setError(key as keyof GenerateSalarySlipsFormValues, {
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
            {error && <p className="text-red-500 text-sm text-red-600">{error}</p>}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Month */}
                <div className="space-y-2">
                    <Label htmlFor="month">Month</Label>
                    <Select
                        onValueChange={(value) => setValue('month', value)}
                        defaultValue={form.getValues('month')}
                    >
                        <SelectTrigger id="month" className={cn({ 'border-red-500': errors.month })}>
                            <SelectValue placeholder="Select Month" />
                        </SelectTrigger>
                        <SelectContent>
                            {months.map((month) => (
                                <SelectItem key={month} value={month}>
                                    {month}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.month && <p className="text-red-500 text-sm">{errors.month.message}</p>}
                </div>

                {/* Year */}
                <div className="space-y-2">
                    <Label htmlFor="year">Year</Label>
                    <Input
                        id="year"
                        type="number"
                        {...register('year')}
                        className={cn({ 'border-red-500': errors.year })}
                    />
                    {errors.year && <p className="text-red-500 text-sm">{errors.year.message}</p>}
                </div>

                {/* Paid At */}
                <div className="space-y-2">
                    <Label htmlFor="paidAt">Paid Date</Label>
                    <Input
                        id="paidAt"
                        type="date"
                        {...register('paidAt')}
                        className={cn({ 'border-red-500': errors.paidAt })}
                    />
                    {errors.paidAt && <p className="text-red-500 text-sm">{errors.paidAt.message}</p>}
                </div>
            </div>

            {/* Employee Selection */}
            <div className="space-y-4">
                <Label className="text-base font-semibold">Select Employees to Generate Slips</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-60 overflow-y-auto border p-4 rounded-md">
                    {employees.length === 0 ? (
                        <p className="col-span-full text-center text-gray-500">No employees found or no employees without a salary structure.</p>
                    ) : (
                        employees.map((employee) => (
                            <div key={employee.id} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`employee-${employee.id}`}
                                    checked={selectedEmployeeIds.includes(employee.id)}
                                    onCheckedChange={(checked) => {
                                        const newSelected = new Set(selectedEmployeeIds);
                                        if (checked) {
                                            newSelected.add(employee.id);
                                        } else {
                                            newSelected.delete(employee.id);
                                        }
                                        setValue('selectedEmployeeIds', Array.from(newSelected), { shouldValidate: true });
                                    }}
                                    disabled={!employee.hasSalaryStructure}
                                />
                                <label
                                    htmlFor={`employee-${employee.id}`}
                                    className={cn(
                                        "text-sm font-medium leading-none",
                                        !employee.hasSalaryStructure && "text-gray-400 cursor-not-allowed"
                                    )}
                                >
                                    {employee.name} ({employee.type})
                                    {!employee.hasSalaryStructure && <span className="text-xs text-red-500 ml-1">(No Salary Structure)</span>}
                                </label>
                            </div>
                        ))
                    )}
                </div>
                {errors.selectedEmployeeIds && <p className="text-red-500 text-sm">{errors.selectedEmployeeIds.message}</p>}
            </div>

            <Button type="submit" disabled={isPending || selectedEmployeeIds.length === 0}>
                {isPending ? 'Generating...' : `Generate Slips for ${selectedEmployeeIds.length} Employee(s)`}
            </Button>
        </form>
    );
}
