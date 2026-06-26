'use client';

import { useRouter } from 'next/navigation';
import { useForm, type Resolver, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChargeType, IncomeCategory } from '@prisma/client';
import { addAdditionalCharge } from '@/actions/finance';
import { useState, useTransition, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const formSchema = z.object({
    name: z.string().min(1, 'Charge name is required'),
    type: z.nativeEnum(ChargeType, { message: 'Invalid charge type' }),
    amount: z.coerce.number().min(0.01, 'Amount must be positive'),
    applicableMonths: z.array(z.string()).min(1, 'Select at least one month'),
    incomeCategory: z.nativeEnum(IncomeCategory, { message: 'Invalid income category' }),
    studentIds: z.array(z.string()).default([]),
    classIds: z.array(z.string()).default([]),
});

type FormValues = z.infer<typeof formSchema>;

interface Student { id: string; name: string; rollNumber: string; classId: string | null }
interface ClassItem { id: string; name: string; section: string | null }

interface Props {
    students: Student[];
    classes: ClassItem[];
}

// Presentational checkbox list — parent owns toggle logic via onToggle / onToggleAll
function CheckList({
    items,
    selected,
    onToggle,
    onToggleAll,
    placeholder,
    renderLabel,
    allSelected,
}: {
    items: { id: string }[];
    selected: string[];
    onToggle: (id: string) => void;
    onToggleAll: () => void;
    placeholder: string;
    renderLabel: (item: any) => string;
    allSelected: boolean;
}) {
    const [search, setSearch] = useState('');
    const filtered = items.filter(i => renderLabel(i).toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="border border-border rounded-lg overflow-hidden">
            <div className="px-3 py-2 border-b border-border bg-muted/30 flex items-center gap-2">
                <Input
                    placeholder={placeholder}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="h-7 text-xs bg-card"
                />
                <button type="button" onClick={onToggleAll} className="text-xs text-muted-foreground whitespace-nowrap hover:text-foreground shrink-0">
                    {allSelected ? 'Clear all' : 'Select all'}
                </button>
            </div>
            <div className="max-h-44 overflow-y-auto divide-y divide-border">
                {filtered.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-muted-foreground">No results.</p>
                ) : (
                    filtered.map((item: any) => (
                        <label key={item.id} className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-muted/30 text-sm select-none">
                            <Checkbox
                                checked={selected.includes(item.id)}
                                onCheckedChange={() => onToggle(item.id)}
                            />
                            {renderLabel(item)}
                        </label>
                    ))
                )}
            </div>
            {selected.length > 0 && (
                <div className="px-3 py-1.5 border-t border-border bg-muted/20 text-xs text-muted-foreground">
                    {selected.length} of {items.length} selected
                </div>
            )}
        </div>
    );
}

export default function AdditionalChargeForm({ students, classes }: Props) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const { register, handleSubmit, control, setValue, watch, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(formSchema) as Resolver<FormValues>,
        defaultValues: { applicableMonths: [], studentIds: [], classIds: [] },
    });

    const chargeType = watch('type');
    const selectedMonths = watch('applicableMonths');
    const studentIds = watch('studentIds');
    const classIds = watch('classIds');

    // Map classId → student IDs for fast lookup
    const studentsByClass = useMemo(() => {
        const map = new Map<string, string[]>();
        for (const s of students) {
            if (s.classId) {
                const arr = map.get(s.classId) ?? [];
                arr.push(s.id);
                map.set(s.classId, arr);
            }
        }
        return map;
    }, [students]);

    // Map studentId → classId
    const classOfStudent = useMemo(() => {
        const map = new Map<string, string>();
        for (const s of students) {
            if (s.classId) map.set(s.id, s.classId);
        }
        return map;
    }, [students]);

    // --- Class toggle handlers ---

    function handleToggleClass(classId: string) {
        const classStudentIds = studentsByClass.get(classId) ?? [];
        if (classIds.includes(classId)) {
            // Uncheck class → remove class + remove all its students
            setValue('classIds', classIds.filter(id => id !== classId));
            setValue('studentIds', studentIds.filter(id => !classStudentIds.includes(id)));
        } else {
            // Check class → add class + add all its students
            setValue('classIds', [...classIds, classId]);
            setValue('studentIds', [...new Set([...studentIds, ...classStudentIds])]);
        }
    }

    function handleToggleAllClasses() {
        if (classIds.length === classes.length) {
            // Clear all classes + all students that belong to any class
            const allClassStudentIds = new Set(students.filter(s => s.classId).map(s => s.id));
            setValue('classIds', []);
            setValue('studentIds', studentIds.filter(id => !allClassStudentIds.has(id)));
        } else {
            // Select all classes + all students
            setValue('classIds', classes.map(c => c.id));
            setValue('studentIds', students.map(s => s.id));
        }
    }

    // --- Student toggle handlers ---

    function handleToggleStudent(studentId: string) {
        const studentClassId = classOfStudent.get(studentId);

        if (studentIds.includes(studentId)) {
            // Uncheck student → remove student + uncheck its class (if checked)
            setValue('studentIds', studentIds.filter(id => id !== studentId));
            if (studentClassId) {
                setValue('classIds', classIds.filter(id => id !== studentClassId));
            }
        } else {
            // Check student → add student
            const newStudentIds = [...studentIds, studentId];
            setValue('studentIds', newStudentIds);
            // If all students of this class are now checked → check the class too
            if (studentClassId) {
                const classStudentIds = studentsByClass.get(studentClassId) ?? [];
                const allChecked = classStudentIds.every(id => newStudentIds.includes(id));
                if (allChecked && !classIds.includes(studentClassId)) {
                    setValue('classIds', [...classIds, studentClassId]);
                }
            }
        }
    }

    function handleToggleAllStudents() {
        if (studentIds.length === students.length) {
            // Clear all students + all classes
            setValue('studentIds', []);
            setValue('classIds', []);
        } else {
            // Select all students + check every class that has at least one student
            setValue('studentIds', students.map(s => s.id));
            setValue('classIds', classes.map(c => c.id));
        }
    }

    // --- Month toggle ---

    function toggleMonth(month: string) {
        const current = selectedMonths || [];
        setValue(
            'applicableMonths',
            current.includes(month) ? current.filter(m => m !== month) : [...current, month],
            { shouldValidate: true }
        );
    }

    // --- Submit ---

    const onSubmit = async (data: FormValues) => {
        setError(null);
        startTransition(async () => {
            const formData = new FormData();
            formData.append('name', data.name);
            formData.append('type', data.type);
            formData.append('amount', data.amount.toString());
            formData.append('incomeCategory', data.incomeCategory);
            data.applicableMonths.forEach(m => formData.append('applicableMonths', m));
            data.studentIds.forEach(id => formData.append('studentIds', id));
            data.classIds.forEach(id => formData.append('classIds', id));

            const result = await addAdditionalCharge(undefined, formData);
            if (result.success) {
                router.push('/school/finance/charges');
                router.refresh();
            } else {
                setError(result.message || 'Failed to add additional charge.');
            }
        });
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div className="space-y-1.5">
                    <Label>Charge Name</Label>
                    <Input {...register('name')} className={cn({ 'border-destructive': errors.name })} placeholder="e.g. Sports Day Fee" />
                    {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                </div>

                {/* Amount */}
                <div className="space-y-1.5">
                    <Label>Amount (Rs)</Label>
                    <Input type="number" step="0.01" {...register('amount')} className={cn({ 'border-destructive': errors.amount })} placeholder="0.00" />
                    {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
                </div>

                {/* Type */}
                <div className="space-y-1.5">
                    <Label>Charge Type</Label>
                    <Controller
                        control={control}
                        name="type"
                        render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger className={cn({ 'border-destructive': errors.type })}>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="OneTime">One-Time (charged once in a specific month)</SelectItem>
                                    <SelectItem value="Recurring">Recurring (repeats every selected month)</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    />
                    {errors.type && <p className="text-xs text-destructive">{errors.type.message}</p>}
                </div>

                {/* Income Category */}
                <div className="space-y-1.5">
                    <Label>Income Category</Label>
                    <Controller
                        control={control}
                        name="incomeCategory"
                        render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger className={cn({ 'border-destructive': errors.incomeCategory })}>
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.values(IncomeCategory).map(c => (
                                        <SelectItem key={c} value={c}>{c}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    />
                    {errors.incomeCategory && <p className="text-xs text-destructive">{errors.incomeCategory.message}</p>}
                </div>
            </div>

            {/* Month selection */}
            {chargeType === 'OneTime' && (
                <div className="space-y-1.5">
                    <Label>Month this charge applies to <span className="text-destructive">*</span></Label>
                    <p className="text-xs text-muted-foreground">The charge will be included in the challan generated for this month.</p>
                    <Controller
                        control={control}
                        name="applicableMonths"
                        render={({ field }) => (
                            <Select value={field.value?.[0] || ''} onValueChange={v => field.onChange([v])}>
                                <SelectTrigger className={cn('max-w-xs', { 'border-destructive': errors.applicableMonths })}>
                                    <SelectValue placeholder="Select month" />
                                </SelectTrigger>
                                <SelectContent>
                                    {MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        )}
                    />
                    {errors.applicableMonths && <p className="text-xs text-destructive">{errors.applicableMonths.message}</p>}
                </div>
            )}

            {chargeType === 'Recurring' && (
                <div className="space-y-2">
                    <Label>Months this charge recurs <span className="text-destructive">*</span></Label>
                    <p className="text-xs text-muted-foreground">The charge will be added to challans for each selected month.</p>
                    <div className="grid grid-cols-4 gap-y-2 gap-x-4 pt-1">
                        {MONTHS.map(month => (
                            <label key={month} className="flex items-center gap-2 cursor-pointer select-none">
                                <Checkbox
                                    checked={(selectedMonths || []).includes(month)}
                                    onCheckedChange={() => toggleMonth(month)}
                                />
                                <span className="text-sm">{month}</span>
                            </label>
                        ))}
                    </div>
                    {errors.applicableMonths && <p className="text-xs text-destructive">{errors.applicableMonths.message}</p>}
                </div>
            )}

            {!chargeType && (
                <p className="text-sm text-muted-foreground">Select a charge type above to configure the applicable month(s).</p>
            )}

            {/* Target — students and classes with bidirectional sync */}
            <div className="space-y-1 border-t border-border pt-5">
                <p className="text-sm font-medium text-foreground">Who this charge applies to</p>
                <p className="text-xs text-muted-foreground pb-3">
                    Leave both lists empty to apply to <strong>all students</strong>. Checking a class auto-selects all its students, and vice versa.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label>Classes <span className="text-muted-foreground font-normal">(optional)</span></Label>
                        <CheckList
                            items={classes}
                            selected={classIds}
                            onToggle={handleToggleClass}
                            onToggleAll={handleToggleAllClasses}
                            placeholder="Search classes…"
                            renderLabel={(c: ClassItem) => `${c.name}${c.section ? ` (${c.section})` : ''}`}
                            allSelected={classIds.length === classes.length}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label>Students <span className="text-muted-foreground font-normal">(optional)</span></Label>
                        <CheckList
                            items={students}
                            selected={studentIds}
                            onToggle={handleToggleStudent}
                            onToggleAll={handleToggleAllStudents}
                            placeholder="Search students…"
                            renderLabel={(s: Student) => `${s.name} (${s.rollNumber})`}
                            allSelected={studentIds.length === students.length}
                        />
                    </div>
                </div>
            </div>

            <Button type="submit" disabled={isPending}>
                {isPending ? 'Adding…' : 'Add Additional Charge'}
            </Button>
        </form>
    );
}
