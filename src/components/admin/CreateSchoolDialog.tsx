'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createSchool, CreateSchoolState } from '@/actions/school';
import { useActionState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Plus } from 'lucide-react';

const schema = z.object({
    name: z.string().min(1, 'School Name is required'),
    slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be URL-friendly (lowercase letters, numbers, hyphens)'),
    adminUsername: z.string().min(3, 'Admin Username must be at least 3 chars'),
    adminPassword: z.string().min(6, 'Admin Password must be at least 6 chars'),
});

type FormData = z.infer<typeof schema>;

export function CreateSchoolDialog() {
    const [open, setOpen] = useState(false);
    const [state, action, pending] = useActionState(createSchool, undefined);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
        reset,
    } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    // Auto-generate slug from name
    const nameValue = watch('name');
    useEffect(() => {
        if (nameValue) {
            const generatedSlug = nameValue
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');
            setValue('slug', generatedSlug, { shouldValidate: true });
        }
    }, [nameValue, setValue]);

    useEffect(() => {
        if (state?.message === 'School created successfully') {
            setOpen(false);
            reset();
        }
    }, [state, reset]);

    const onSubmit = (data: FormData) => {
        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('slug', data.slug);
        formData.append('adminUsername', data.adminUsername);
        formData.append('adminPassword', data.adminPassword);

        // Trigger server action
        action(formData);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create School
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create New School</DialogTitle>
                    <DialogDescription>
                        Add a new school tenant and its initial administrator.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">School Name</Label>
                        <Input id="name" {...register('name')} placeholder="e.g. Green Valley High" />
                        {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="slug">Slug</Label>
                        <Input id="slug" {...register('slug')} placeholder="e.g. green-valley" />
                        {errors.slug && <p className="text-red-500 text-xs">{errors.slug.message}</p>}
                        {state?.errors?.slug && <p className="text-red-500 text-xs">{state.errors.slug[0]}</p>}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="adminUsername">Admin Username</Label>
                        <Input id="adminUsername" {...register('adminUsername')} />
                        {errors.adminUsername && <p className="text-red-500 text-xs">{errors.adminUsername.message}</p>}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="adminPassword">Admin Password</Label>
                        <Input id="adminPassword" type="password" {...register('adminPassword')} />
                        {errors.adminPassword && <p className="text-red-500 text-xs">{errors.adminPassword.message}</p>}
                    </div>

                    {state?.message && state.message !== 'School created successfully' && (
                        <div className="bg-red-50 text-red-600 p-2 text-sm rounded">
                            {state.message}
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="submit" disabled={pending}>
                            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {pending ? 'Creating...' : 'Create School'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
