'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const tabs = [
    { href: '/school/finance',                 label: 'Overview' },
    { href: '/school/finance/income',          label: 'Income' },
    { href: '/school/finance/expense',         label: 'Expenses' },
    { href: '/school/finance/challan',         label: 'Fee Challans' },
    { href: '/school/finance/charges',         label: 'Additional Charges' },
    { href: '/school/finance/salary-slips',    label: 'Salary Slips' },
];

export default function FinanceNav() {
    const pathname = usePathname();

    const isActive = (href: string) => {
        if (href === '/school/finance') return pathname === '/school/finance';
        return pathname === href || pathname.startsWith(href + '/');
    };

    return (
        <div className="border-b border-border bg-card">
            <nav className="flex overflow-x-auto px-6 md:px-8" aria-label="Finance sections">
                {tabs.map((tab) => (
                    <Link
                        key={tab.href}
                        href={tab.href}
                        className={cn(
                            'shrink-0 px-4 py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                            isActive(tab.href)
                                ? 'border-foreground text-foreground'
                                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                        )}
                    >
                        {tab.label}
                    </Link>
                ))}
            </nav>
        </div>
    );
}
