import { getSession } from '@/lib/session';
import db from '@/lib/db';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, GraduationCap, BookOpen, ArrowUpRight, ArrowDownRight, DollarSign, Plus } from 'lucide-react';
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
                            <div className="text-2xl font-bold text-foreground">${totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                            <p className="text-xs text-muted-foreground mt-1">All time income</p>
                        </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-red-500 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Expense</CardTitle>
                            <ArrowDownRight className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-foreground">${totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                            <p className="text-xs text-muted-foreground mt-1">All time expenses</p>
                        </CardContent>
                    </Card>
                    <Card className={`border-l-4 shadow-sm ${netProfit >= 0 ? 'border-l-blue-500' : 'border-l-orange-500'}`}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Net Balance</CardTitle>
                            <DollarSign className={`h-4 w-4 ${netProfit >= 0 ? 'text-blue-500' : 'text-orange-500'}`} />
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                                ${netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
                                                {transaction.type === 'Income' ? '+' : '-'}${Number(transaction.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
                        <CardContent className="space-y-4">
                            <Link href="/school/finance/income/new">
                                <Button className="w-full justify-start bg-green-600 hover:bg-green-700 text-white">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add New Income
                                </Button>
                            </Link>
                            <Link href="/school/finance/expense/new">
                                <Button className="w-full justify-start bg-red-600 hover:bg-red-700 text-white">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Record New Expense
                                </Button>
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
    const studentCount = await db.student.count({ where: { schoolId: session.schoolId! } });
    const teacherCount = await db.teacher.count({ where: { schoolId: session.schoolId! } });
    const classCount = await db.class.count({ where: { schoolId: session.schoolId! } });

    const stats = [
        {
            title: "Total Students",
            value: studentCount.toString(),
            icon: GraduationCap,
            description: "Active students",
            color: "text-blue-600",
            bg: "bg-blue-50 dark:bg-blue-900/20"
        },
        {
            title: "Total Teachers",
            value: teacherCount.toString(),
            icon: Users,
            description: "Registered staff",
            color: "text-emerald-600",
            bg: "bg-emerald-50 dark:bg-emerald-900/20"
        },
        {
            title: "Active Classes",
            value: classCount.toString(),
            icon: BookOpen,
            description: "Current academic year",
            color: "text-violet-600",
            bg: "bg-violet-50 dark:bg-violet-900/20"
        }
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

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
                    <CardHeader>
                        <CardTitle className="text-lg text-foreground">Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-muted-foreground py-8 text-center italic">
                            No recent activity to show.
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-border shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg text-foreground">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Link href="/school/students/new">
                            <Button className="w-full justify-start" variant="outline">
                                <Users className="mr-2 h-4 w-4" />
                                Admit New Student
                            </Button>
                        </Link>
                        <Link href="/school/academics/promote">
                            <Button className="w-full justify-start" variant="outline">
                                <GraduationCap className="mr-2 h-4 w-4" />
                                Promote Students
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
