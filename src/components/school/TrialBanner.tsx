'use client';

import Link from 'next/link';
import { AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';

interface TrialBannerProps {
    daysLeft: number;
    plan: string;
    status: string;
}

export function TrialBanner({ daysLeft, status }: TrialBannerProps) {
    const [dismissed, setDismissed] = useState(false);

    if (dismissed) return null;

    const isExpired = status === 'Expired' || (status === 'Trial' && daysLeft <= 0);
    const isUrgent = daysLeft <= 3;

    if (status === 'Active') return null; // Paid plan — no banner

    const bg = isExpired
        ? 'bg-red-600'
        : isUrgent
            ? 'bg-orange-500'
            : 'bg-amber-500';

    const message = isExpired
        ? 'Your free trial has expired. Enrolment and user creation are paused.'
        : daysLeft <= 7
            ? `Your free trial ends in ${daysLeft} day${daysLeft === 1 ? '' : 's'}.`
            : `You have ${daysLeft} days left in your free trial.`;

    return (
        <div className={`${bg} text-white px-4 py-2.5 flex items-center justify-between gap-4 print:hidden`}>
            <div className="flex items-center gap-2 text-sm font-medium">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{message}</span>
                <Link
                    href="/school/settings/billing"
                    className="underline underline-offset-2 hover:no-underline font-semibold"
                >
                    View billing →
                </Link>
            </div>
            {!isExpired && (
                <button
                    onClick={() => setDismissed(true)}
                    className="p-1 rounded hover:bg-black/10 transition-colors shrink-0"
                    aria-label="Dismiss"
                >
                    <X className="h-4 w-4" />
                </button>
            )}
        </div>
    );
}
