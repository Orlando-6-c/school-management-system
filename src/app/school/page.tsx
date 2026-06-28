import { getSession } from '@/lib/session';
import db from '@/lib/db';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, BookOpen, ArrowUpRight, ArrowDownRight, Banknote, Plus, ClipboardList, Users } from 'lucide-react';
import { getIncomeRecords, getExpenseRecords } from '@/actions/finance';
import { format } from 'date-fns';

export const runtime = 'nodejs';

export default async function SchoolDashboard() {
    const session = await getSession();

    // ----------------------------------------------------------------------
    // FINANCE DASHBOARD (For 'Finance' Role)
    // ----------------------------------------------------------------------
    if (session.role === 'Finance') {
        const rawIncome = await getIncomeRecords();
        const rawExpense = await getExpenseRecords();

        // Ensure they are arrays
        const incomeRecords = Array.isArray(rawIncome) ? rawIncome : [];
        const expenseRecords = Array.isArray(rawExpense) ? rawExpense : [];

        // Calculate totals
        const totalIncome = incomeRecords.reduce((sum: number, record: any) => sum + (Number(record?.amount) || 0), 0);
        const totalExpense = expenseRecords.reduce((sum: number, record: any) => sum + (Number(record?.amount) || 0), 0);
        const netProfit = totalIncome - totalExpense;

        // Get recent transactions (combine and sort)
        const recentTransactions = [
            ...incomeRecords.map((r: any) => ({ ...r, type: 'Income' })),
            ...expenseRecords.map((r: any) => ({ ...r, type: 'Expense' }))
        ].sort((a: any, b: any) => {
            const dateA = a.date ? new Date(a.date).getTime() : 0;
            const dateB = b.date ? new Date(b.date).getTime() : 0;
            return dateB - dateA;
        }).slice(0, 5);

        return (
            <div className="space-y-8">
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Finance Dashboard</h1>
                        <p className="text-muted-foreground mt-2 text-lg">
                            Welcome back, <span className="font-semibold text-foreground">{session.username}</span>!
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="border-l-4 border-l-green-500 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Income</CardTitle>
                            <ArrowUpRight className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-foreground">Rs {totalIncome.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground mt-1">All time income</p>
                        </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-red-500 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Expense</CardTitle>
                            <ArrowDownRight className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-foreground">Rs {totalExpense.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground mt-1">All time expenses</p>
                        </CardContent>
                    </Card>
                    <Card className={`border-l-4 shadow-sm ${netProfit >= 0 ? 'border-l-blue-500' : 'border-l-orange-500'}`}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Net Balance</CardTitle>
                            <Banknote className={`h-4 w-4 ${netProfit >= 0 ? 'text-blue-500' : 'text-orange-500'}`} />
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                                Rs {netProfit.toLocaleString()}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Available funds</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <Card className="border-border shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg text-foreground">Recent Transactions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {recentTransactions.length === 0 ? (
                                    <p className="text-center text-muted-foreground py-4">No recent transactions found.</p>
                                ) : (
                                    recentTransactions.map((transaction: any) => (
                                        <div key={transaction.transactionId || Math.random()} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted dark:hover:bg-gray-800 transition-colors">
                                            <div className="flex items-center space-x-3">
                                                <div className={`p-2 rounded-full ${transaction.type === 'Income' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                                                    {transaction.type === 'Income' ? (
                                                        <ArrowUpRight className={`h-4 w-4 ${transaction.type === 'Income' ? 'text-green-600' : 'text-red-600'}`} />
                                                    ) : (
                                                        <ArrowDownRight className={`h-4 w-4 ${transaction.type === 'Income' ? 'text-green-600' : 'text-red-600'}`} />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-foreground">{transaction.description || 'No Description'}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {transaction.date ? format(new Date(transaction.date), 'MMM dd, yyyy') : 'N/A'} • {transaction.category || 'Uncategorized'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className={`font-semibold text-sm ${transaction.type === 'Income' ? 'text-green-600' : 'text-red-600'}`}>
                                                {transaction.type === 'Income' ? '+' : '-'}Rs {Number(transaction.amount || 0).toLocaleString()}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg text-foreground">Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Link href="/school/finance/income/new" className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary hover:bg-accent transition-colors">
                                <div className="h-8 w-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                                    <Plus className="h-4 w-4 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-foreground">Add Income</p>
                                    <p className="text-xs text-muted-foreground">Record a new payment</p>
                                </div>
                            </Link>
                            <Link href="/school/finance/expense/new" className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary hover:bg-accent transition-colors">
                                <div className="h-8 w-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                                    <ArrowDownRight className="h-4 w-4 text-red-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-foreground">Record Expense</p>
                                    <p className="text-xs text-muted-foreground">Log a new expense</p>
                                </div>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    // ----------------------------------------------------------------------
    // ACADEMIC DASHBOARD (For SchoolAdmin and others)
    // ----------------------------------------------------------------------

    // Fetch real counts
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [studentCount, teacherCount, classCount, presentToday, recentActivity] = await Promise.all([
        db.student.count({ where: { schoolId: session.schoolId!, isActive: true } }),
        db.teacher.count({ where: { schoolId: session.schoolId!, isActive: true } }),
        db.class.count({ where: { schoolId: session.schoolId!, isActive: true } }),
        db.attendance.count({ where: { schoolId: session.schoolId!, date: { gte: today }, isPresent: true } }),
        db.auditLog.findMany({ where: { schoolId: session.schoolId! }, orderBy: { createdAt: 'desc' }, take: 8 }),
    ]);

    const stats = [
        {
            title: 'Total Students',
            value: studentCount.toString(),
            icon: GraduationCap,
            description: 'Active enrolment',
            color: 'text-blue-600',
            bg: 'bg-blue-50 dark:bg-blue-900/20',
        },
        {
            title: 'Teaching Staff',
            value: teacherCount.toString(),
            icon: Users,
            description: 'Active teachers',
            color: 'text-emerald-600',
            bg: 'bg-emerald-50 dark:bg-emerald-900/20',
        },
        {
            title: 'Active Classes',
            value: classCount.toString(),
            icon: BookOpen,
            description: 'This academic year',
            color: 'text-violet-600',
            bg: 'bg-violet-50 dark:bg-violet-900/20',
        },
        {
            title: 'Present Today',
            value: presentToday.toString(),
            icon: ClipboardList,
            description: 'Attendance so far',
            color: 'text-amber-600',
            bg: 'bg-amber-50 dark:bg-amber-900/20',
        },
    ];

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
                    <p className="text-muted-foreground mt-2 text-lg">
                        Welcome back, <span className="font-semibold text-foreground">{session.username}</span>!
                    </p>
                </div>
                <div className="text-sm text-muted-foreground">
                    {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat, index) => (
                    <Card key={index} className="border-border shadow-sm hover:shadow-md transition-shadow duration-200">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {stat.title}
                            </CardTitle>
                            <div className={`p-2 rounded-lg ${stat.bg}`}>
                                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                            <div className="flex items-center mt-1 text-xs text-muted-foreground">
                                <span className="text-emerald-600 flex items-center mr-1 font-medium">
                                    <ArrowUpRight className="h-3 w-3 mr-0.5" />
                                    0%
                                </span>
                                from last month
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-border shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg text-foreground">Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {recentActivity.length === 0 ? (
                            <div className="text-sm text-muted-foreground py-8 text-center italic">No recent activity to show.</div>
                        ) : (
                            <div className="space-y-2">
                                {recentActivity.map((log) => {
                                    const [op, ...modelParts] = log.action.split('_');
                                    const opLabel: Record<string, string> = { create: 'Created', createMany: 'Created', update: 'Updated', updateMany: 'Updated', delete: 'Deleted', deleteMany: 'Deleted', upsert: 'Saved' };
                                    const modelLabel = modelParts.join(' ').replace(/([A-Z])/g, ' $1').trim();
                                    return (
                                        <div key={log.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border">
                                            <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${op === 'create' || op === 'createMany' ? 'bg-green-500' : op === 'delete' || op === 'deleteMany' ? 'bg-red-500' : 'bg-blue-500'}`} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-foreground">{opLabel[op] ?? op} {modelLabel}</p>
                                                <p className="text-xs text-muted-foreground">{format(new Date(log.createdAt), 'MMM dd, yyyy HH:mm')}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-border shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg text-foreground">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Link href="/school/students/new" className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary hover:bg-accent transition-colors group">
                            <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                                <GraduationCap className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-foreground">New Admission</p>
                                <p className="text-xs text-muted-foreground">Add a student to the system</p>
                            </div>
                        </Link>
                        <Link href="/school/attendance" className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary hover:bg-accent transition-colors group">
                            <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                                <ClipboardList className="h-4 w-4 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-foreground">Mark Attendance</p>
                                <p className="text-xs text-muted-foreground">Record today&apos;s attendance</p>
                            </div>
                        </Link>
                        <Link href="/school/finance/income/new" className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary hover:bg-accent transition-colors group">
                            <div className="h-8 w-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                                <ArrowUpRight className="h-4 w-4 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-foreground">Record Income</p>
                                <p className="text-xs text-muted-foreground">Log a payment or fee</p>
                            </div>
                        </Link>
                        <Link href="/school/academics/promote" className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary hover:bg-accent transition-colors group">
                            <div className="h-8 w-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
                                <GraduationCap className="h-4 w-4 text-violet-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-foreground">Promote Students</p>
                                <p className="text-xs text-muted-foreground">Move classes up a grade</p>
                            </div>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
