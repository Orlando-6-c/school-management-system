'use client';

import { useActionState, useState } from 'react';
import { registerSchool, type RegisterSchoolState } from '@/actions/school';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';

function toSlug(value: string) {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 60);
}

export function RegisterForm() {
    const [state, formAction, isPending] = useActionState<RegisterSchoolState | undefined, FormData>(
        registerSchool,
        undefined,
    );

    const [schoolName, setSchoolName] = useState('');
    const [slug, setSlug] = useState('');
    const [slugEdited, setSlugEdited] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    function handleSchoolNameChange(e: React.ChangeEvent<HTMLInputElement>) {
        const val = e.target.value;
        setSchoolName(val);
        if (!slugEdited) setSlug(toSlug(val));
    }

    function handleSlugChange(e: React.ChangeEvent<HTMLInputElement>) {
        setSlug(toSlug(e.target.value));
        setSlugEdited(true);
    }

    return (
        <form action={formAction} className="space-y-5">
            {state?.message && (
                <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3">
                    {state.message}
                </p>
            )}

            {/* School details */}
            <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">School Details</p>
                <div className="space-y-1.5">
                    <Label htmlFor="schoolName">School Name *</Label>
                    <Input
                        id="schoolName"
                        name="schoolName"
                        placeholder="e.g. Sunrise Academy"
                        value={schoolName}
                        onChange={handleSchoolNameChange}
                        autoComplete="organization"
                    />
                    {state?.errors?.schoolName && (
                        <p className="text-xs text-destructive">{state.errors.schoolName[0]}</p>
                    )}
                </div>

                <div className="space-y-1.5 mt-3">
                    <Label htmlFor="schoolSlug">
                        School URL Slug *
                        <span className="ml-2 text-xs font-normal text-muted-foreground">(used at login)</span>
                    </Label>
                    <div className="flex items-center border border-input rounded-md focus-within:ring-2 focus-within:ring-ring overflow-hidden">
                        <span className="px-3 py-2 text-sm text-muted-foreground bg-muted border-r border-input select-none whitespace-nowrap">
                            school/
                        </span>
                        <input
                            id="schoolSlug"
                            name="schoolSlug"
                            value={slug}
                            onChange={handleSlugChange}
                            placeholder="sunrise-academy"
                            className="flex-1 px-3 py-2 text-sm bg-transparent outline-none"
                            autoComplete="off"
                        />
                    </div>
                    {state?.errors?.schoolSlug && (
                        <p className="text-xs text-destructive">{state.errors.schoolSlug[0]}</p>
                    )}
                </div>
            </div>

            <hr className="border-border" />

            {/* Admin account */}
            <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Admin Account</p>

                <div className="space-y-1.5">
                    <Label htmlFor="adminUsername">Username *</Label>
                    <Input
                        id="adminUsername"
                        name="adminUsername"
                        placeholder="e.g. principal_ali"
                        autoComplete="username"
                    />
                    {state?.errors?.adminUsername && (
                        <p className="text-xs text-destructive">{state.errors.adminUsername[0]}</p>
                    )}
                </div>

                <div className="space-y-1.5 mt-3">
                    <Label htmlFor="password">Password *</Label>
                    <div className="relative">
                        <Input
                            id="password"
                            name="password"
                            type={showPass ? 'text' : 'password'}
                            placeholder="Min. 8 characters"
                            autoComplete="new-password"
                            className="pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPass((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            tabIndex={-1}
                        >
                            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                    {state?.errors?.password && (
                        <p className="text-xs text-destructive">{state.errors.password[0]}</p>
                    )}
                </div>

                <div className="space-y-1.5 mt-3">
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <div className="relative">
                        <Input
                            id="confirmPassword"
                            name="confirmPassword"
                            type={showConfirm ? 'text' : 'password'}
                            placeholder="Re-enter your password"
                            autoComplete="new-password"
                            className="pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirm((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            tabIndex={-1}
                        >
                            {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                    {state?.errors?.confirmPassword && (
                        <p className="text-xs text-destructive">{state.errors.confirmPassword[0]}</p>
                    )}
                </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isPending}>
                {isPending ? 'Creating your school…' : 'Create School & Get Started'}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
                By registering you agree to our Terms of Service. Your data is isolated and secure.
            </p>
        </form>
    );
}
