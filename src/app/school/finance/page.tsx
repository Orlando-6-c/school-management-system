import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { getIncomeRecords, getExpenseRecords } from '@/actions/finance';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus, ArrowUpRight, ArrowDownRight, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';

export default async function FinancePage() {
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
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Finance Dashboard</h1>
                <div className="flex space-x-2">
                    <Link href="/school/finance/income/new">
                        <Button className="bg-green-600 hover:bg-green-700">
                            <Plus className="mr-2 h-4 w-4" /> Add Income
                        </Button>
                    </Link>
                    <Link href="/school/finance/expense/new">
                        <Button className="bg-red-600 hover:bg-red-700">
                            <Plus className="mr-2 h-4 w-4" /> Add Expense
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-l-4 border-l-green-500 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Income</CardTitle>
                        <ArrowUpRight className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900">${totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        <p className="text-xs text-muted-foreground mt-1">All time income</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-red-500 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Expense</CardTitle>
                        <ArrowDownRight className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900">${totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
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

            <div className="grid grid-cols-1 gap-6">
                <Card className="shadow-sm border-border">
                    <CardHeader>
                        <CardTitle>Recent Transactions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentTransactions.length === 0 ? (
                                <p className="text-center text-gray-500 py-4">No recent transactions found.</p>
                            ) : (
                                recentTransactions.map((transaction: any) => (
                                    <div key={transaction.transactionId || Math.random()} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center space-x-4">
                                            <div className={`p-2 rounded-full ${transaction.type === 'Income' ? 'bg-green-100' : 'bg-red-100'}`}>
                                                {transaction.type === 'Income' ? (
                                                    <ArrowUpRight className={`h-4 w-4 ${transaction.type === 'Income' ? 'text-green-600' : 'text-red-600'}`} />
                                                ) : (
                                                    <ArrowDownRight className={`h-4 w-4 ${transaction.type === 'Income' ? 'text-green-600' : 'text-red-600'}`} />
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{transaction.description || 'No Description'}</p>
                                                <p className="text-xs text-gray-500">
                                                    {transaction.date ? format(new Date(transaction.date), 'MMM dd, yyyy') : 'N/A'} • {transaction.category || 'Uncategorized'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className={`font-semibold ${transaction.type === 'Income' ? 'text-green-600' : 'text-red-600'}`}>
                                            {transaction.type === 'Income' ? '+' : '-'}${Number(transaction.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
