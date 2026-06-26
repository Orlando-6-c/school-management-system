import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { hasPermission } from '@/lib/authz';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ReceiptText, AlertCircle, TrendingUp, Wallet } from 'lucide-react';

export const runtime = 'nodejs';

const REPORTS = [
    {
        href: '/school/reports/fee-collection',
        icon: ReceiptText,
        title: 'Fee Collection',
        description: 'Monthly summary of paid, pending, and overdue challans.',
    },
    {
        href: '/school/reports/defaulters',
        icon: AlertCircle,
        title: 'Defaulters',
        description: 'Students with outstanding fee balance past their due date.',
    },
    {
        href: '/school/reports/income-expense',
        icon: TrendingUp,
        title: 'Income vs Expense',
        description: 'Yearly income and expense breakdown by month and category.',
    },
    {
        href: '/school/reports/salary-register',
        icon: Wallet,
        title: 'Salary Register',
        description: 'Monthly salary slips for all teachers, staff, and executives.',
    },
];

export default async function ReportsPage() {
    const session = await getSession();
    if (!session.schoolId) redirect('/login');
    if (!(await hasPermission('reports', 'view'))) redirect('/school');

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Reports</h1>
                <p className="text-muted-foreground mt-1">Financial and operational summaries for your school.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
                {REPORTS.map(({ href, icon: Icon, title, description }) => (
                    <Link key={href} href={href}>
                        <Card className="border-border shadow-sm hover:border-primary/50 hover:shadow-md transition-all cursor-pointer h-full">
                            <CardHeader className="pb-2">
                                <div className="flex items-center gap-3">
                                    <div className="bg-primary/10 p-2 rounded-lg">
                                        <Icon className="h-5 w-5 text-primary" />
                                    </div>
                                    <CardTitle className="text-base">{title}</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <CardDescription>{description}</CardDescription>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
