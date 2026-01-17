'use client';

import { useActionState } from 'react';
import { updateSchoolName, updateSessionYear, updateCurrency, updateLogo, SettingsState } from '@/actions/settings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface SettingsFormProps {
    initialSettings: {
        name: string;
        logo: string | null;
        currency: {
            currencyCode: string;
            currencySymbol: string;
        } | null;
        currentFinancialYear: {
            year: number;
            startDate: Date;
            endDate: Date;
        } | null;
    };
}

export default function SettingsForm({ initialSettings }: SettingsFormProps) {
    const [nameState, nameAction, namePending] = useActionState(updateSchoolName, undefined);
    const [yearState, yearAction, yearPending] = useActionState(updateSessionYear, undefined);
    const [currencyState, currencyAction, currencyPending] = useActionState(updateCurrency, undefined);
    const [logoState, logoAction, logoPending] = useActionState(updateLogo, undefined);

    const currentYear = new Date().getFullYear();
    const defaultStartDate = `${currentYear}-07-01`; // July 1st
    const defaultEndDate = `${currentYear + 1}-06-30`; // June 30th next year

    return (
        <div className="space-y-6">
            {/* School Name */}
            <Card>
                <CardHeader>
                    <CardTitle>School Information</CardTitle>
                    <CardDescription>Update your school name.</CardDescription>
                </CardHeader>
                <CardContent>
                    {nameState?.success && (
                        <div className="bg-green-50 text-green-700 p-3 rounded-lg flex items-center mb-4">
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            {nameState.message}
                        </div>
                    )}
                    {nameState?.message && !nameState.success && (
                        <div className="bg-red-50 text-red-700 p-3 rounded-lg flex items-center mb-4">
                            <AlertCircle className="mr-2 h-4 w-4" />
                            {nameState.message}
                        </div>
                    )}
                    <form action={nameAction} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">School Name</Label>
                            <Input
                                id="name"
                                name="name"
                                defaultValue={initialSettings.name}
                                required
                            />
                            {nameState?.errors?.name && (
                                <p className="text-red-500 text-xs">{nameState.errors.name[0]}</p>
                            )}
                        </div>
                        <Button type="submit" disabled={namePending}>
                            {namePending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Update School Name
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Session Year */}
            <Card>
                <CardHeader>
                    <CardTitle>Academic Session</CardTitle>
                    <CardDescription>Set the current academic year and session dates.</CardDescription>
                </CardHeader>
                <CardContent>
                    {yearState?.success && (
                        <div className="bg-green-50 text-green-700 p-3 rounded-lg flex items-center mb-4">
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            {yearState.message}
                        </div>
                    )}
                    {yearState?.message && !yearState.success && (
                        <div className="bg-red-50 text-red-700 p-3 rounded-lg flex items-center mb-4">
                            <AlertCircle className="mr-2 h-4 w-4" />
                            {yearState.message}
                        </div>
                    )}
                    <form action={yearAction} className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                                <Label htmlFor="year">Year</Label>
                                <Input
                                    id="year"
                                    name="year"
                                    type="number"
                                    defaultValue={initialSettings.currentFinancialYear?.year || currentYear}
                                    min="2000"
                                    max="2100"
                                    required
                                />
                                {yearState?.errors?.year && (
                                    <p className="text-red-500 text-xs">{yearState.errors.year[0]}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="startDate">Start Date</Label>
                                <Input
                                    id="startDate"
                                    name="startDate"
                                    type="date"
                                    defaultValue={
                                        initialSettings.currentFinancialYear
                                            ? new Date(initialSettings.currentFinancialYear.startDate).toISOString().split('T')[0]
                                            : defaultStartDate
                                    }
                                    required
                                />
                                {yearState?.errors?.startDate && (
                                    <p className="text-red-500 text-xs">{yearState.errors.startDate[0]}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="endDate">End Date</Label>
                                <Input
                                    id="endDate"
                                    name="endDate"
                                    type="date"
                                    defaultValue={
                                        initialSettings.currentFinancialYear
                                            ? new Date(initialSettings.currentFinancialYear.endDate).toISOString().split('T')[0]
                                            : defaultEndDate
                                    }
                                    required
                                />
                                {yearState?.errors?.endDate && (
                                    <p className="text-red-500 text-xs">{yearState.errors.endDate[0]}</p>
                                )}
                            </div>
                        </div>
                        <Button type="submit" disabled={yearPending}>
                            {yearPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Update Session Year
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Currency */}
            <Card>
                <CardHeader>
                    <CardTitle>Currency Configuration</CardTitle>
                    <CardDescription>Set the default currency for financial transactions.</CardDescription>
                </CardHeader>
                <CardContent>
                    {currencyState?.success && (
                        <div className="bg-green-50 text-green-700 p-3 rounded-lg flex items-center mb-4">
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            {currencyState.message}
                        </div>
                    )}
                    {currencyState?.message && !currencyState.success && (
                        <div className="bg-red-50 text-red-700 p-3 rounded-lg flex items-center mb-4">
                            <AlertCircle className="mr-2 h-4 w-4" />
                            {currencyState.message}
                        </div>
                    )}
                    <form action={currencyAction} className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="currencyCode">Currency Code</Label>
                                <Input
                                    id="currencyCode"
                                    name="currencyCode"
                                    placeholder="PKR, USD, EUR"
                                    defaultValue={initialSettings.currency?.currencyCode || 'PKR'}
                                    required
                                />
                                {currencyState?.errors?.currencyCode && (
                                    <p className="text-red-500 text-xs">{currencyState.errors.currencyCode[0]}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="currencySymbol">Currency Symbol</Label>
                                <Input
                                    id="currencySymbol"
                                    name="currencySymbol"
                                    placeholder="Rs, $, €"
                                    defaultValue={initialSettings.currency?.currencySymbol || 'Rs'}
                                    required
                                />
                                {currencyState?.errors?.currencySymbol && (
                                    <p className="text-red-500 text-xs">{currencyState.errors.currencySymbol[0]}</p>
                                )}
                            </div>
                        </div>
                        <Button type="submit" disabled={currencyPending}>
                            {currencyPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Update Currency
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Logo */}
            <Card>
                <CardHeader>
                    <CardTitle>School Logo</CardTitle>
                    <CardDescription>Upload or update your school logo (URL).</CardDescription>
                </CardHeader>
                <CardContent>
                    {logoState?.success && (
                        <div className="bg-green-50 text-green-700 p-3 rounded-lg flex items-center mb-4">
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            {logoState.message}
                        </div>
                    )}
                    {logoState?.message && !logoState.success && (
                        <div className="bg-red-50 text-red-700 p-3 rounded-lg flex items-center mb-4">
                            <AlertCircle className="mr-2 h-4 w-4" />
                            {logoState.message}
                        </div>
                    )}
                    <form action={logoAction} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="logo">Logo URL</Label>
                            <Input
                                id="logo"
                                name="logo"
                                type="url"
                                placeholder="https://example.com/logo.png"
                                defaultValue={initialSettings.logo || ''}
                            />
                            {logoState?.errors?.logo && (
                                <p className="text-red-500 text-xs">{logoState.errors.logo[0]}</p>
                            )}
                            {initialSettings.logo && (
                                <div className="mt-2">
                                    <p className="text-sm text-gray-600 mb-2">Current Logo:</p>
                                    <img
                                        src={initialSettings.logo}
                                        alt="School Logo"
                                        className="h-20 w-auto object-contain border border-gray-200 rounded"
                                    />
                                </div>
                            )}
                        </div>
                        <Button type="submit" disabled={logoPending}>
                            {logoPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Update Logo
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
