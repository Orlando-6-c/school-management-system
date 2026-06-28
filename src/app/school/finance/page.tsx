import { getIncomeRecords, getExpenseRecords } from '@/actions/finance';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';

function fmt(n: number) {
    return 'Rs ' + n.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export default async function FinancePage() {
    const [incomeRecords, expenseRecords] = await Promise.all([
        getIncomeRecords(),
        getExpenseRecords(),
    ]);

    const income = Array.isArray(incomeRecords) ? incomeRecords : [];
    const expense = Array.isArray(expenseRecords) ? expenseRecords : [];

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const thisMonthIncome = income.filter((r: any) => {
        const d = new Date(r.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    const thisMonthExpense = expense.filter((r: any) => {
        const d = new Date(r.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const totalIncome = income.reduce((s: number, r: any) => s + Number(r.amount), 0);
    const totalExpense = expense.reduce((s: number, r: any) => s + Number(r.amount), 0);
    const monthIncome = thisMonthIncome.reduce((s: number, r: any) => s + Number(r.amount), 0);
    const monthExpense = thisMonthExpense.reduce((s: number, r: any) => s + Number(r.amount), 0);

    // Category breakdown for this month
    const incomeByCat: Record<string, number> = {};
    for (const r of thisMonthIncome as any[]) {
        incomeByCat[r.category] = (incomeByCat[r.category] || 0) + Number(r.amount);
    }
    const expenseByCat: Record<string, number> = {};
    for (const r of thisMonthExpense as any[]) {
        expenseByCat[r.category] = (expenseByCat[r.category] || 0) + Number(r.amount);
    }

    // Recent 8 transactions across both
    const recent = [
        ...(income as any[]).map((r: any) => ({ ...r, _type: 'Income' })),
        ...(expense as any[]).map((r: any) => ({ ...r, _type: 'Expense' })),
    ]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 8);

    const monthName = now.toLocaleString('default', { month: 'long' });

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Finance Overview</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">{monthName} {currentYear}</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/school/finance/income/new">
                        <Button variant="outline" size="sm"><Plus className="h-4 w-4 mr-1.5" />Income</Button>
                    </Link>
                    <Link href="/school/finance/expense/new">
                        <Button variant="outline" size="sm"><Plus className="h-4 w-4 mr-1.5" />Expense</Button>
                    </Link>
                    <Link href="/school/finance/challan/generate">
                        <Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Generate Challans</Button>
                    </Link>
                </div>
            </div>

            {/* Summary cards — 4 simple stat blocks */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: `${monthName} Income`,  value: monthIncome,  note: `${thisMonthIncome.length} records` },
                    { label: `${monthName} Expenses`, value: monthExpense, note: `${thisMonthExpense.length} records` },
                    { label: 'All-time Income',  value: totalIncome,  note: `${income.length} records total` },
                    { label: 'All-time Expenses', value: totalExpense, note: `${expense.length} records total` },
                ].map((s) => (
                    <div key={s.label} className="bg-card border border-border rounded-lg p-4">
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{s.label}</p>
                        <p className="text-xl font-semibold text-foreground mt-1">{fmt(s.value)}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{s.note}</p>
                    </div>
                ))}
            </div>

            {/* Net balance */}
            <div className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">Net Balance (All-time)</p>
                    <p className={`text-2xl font-semibold mt-0.5 ${totalIncome - totalExpense >= 0 ? 'text-foreground' : 'text-destructive'}`}>
                        {fmt(totalIncome - totalExpense)}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-sm font-medium text-muted-foreground">{monthName} Net</p>
                    <p className={`text-xl font-semibold mt-0.5 ${monthIncome - monthExpense >= 0 ? 'text-foreground' : 'text-destructive'}`}>
                        {fmt(monthIncome - monthExpense)}
                    </p>
                </div>
            </div>

            {/* Category breakdown */}
            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-card border border-border rounded-lg overflow-hidden">
                    <div className="px-4 py-3 border-b border-border">
                        <h2 className="text-sm font-semibold text-foreground">{monthName} Income by Category</h2>
                    </div>
                    <table className="w-full text-sm">
                        <tbody>
                            {Object.keys(incomeByCat).length === 0 ? (
                                <tr><td className="px-4 py-6 text-center text-muted-foreground text-xs">No income this month</td></tr>
                            ) : (
                                Object.entries(incomeByCat).map(([cat, amt]) => (
                                    <tr key={cat} className="border-b border-border last:border-0">
                                        <td className="px-4 py-2.5 text-muted-foreground">{cat}</td>
                                        <td className="px-4 py-2.5 text-right font-medium tabular-nums">{fmt(amt)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="bg-card border border-border rounded-lg overflow-hidden">
                    <div className="px-4 py-3 border-b border-border">
                        <h2 className="text-sm font-semibold text-foreground">{monthName} Expenses by Category</h2>
                    </div>
                    <table className="w-full text-sm">
                        <tbody>
                            {Object.keys(expenseByCat).length === 0 ? (
                                <tr><td className="px-4 py-6 text-center text-muted-foreground text-xs">No expenses this month</td></tr>
                            ) : (
                                Object.entries(expenseByCat).map(([cat, amt]) => (
                                    <tr key={cat} className="border-b border-border last:border-0">
                                        <td className="px-4 py-2.5 text-muted-foreground">{cat}</td>
                                        <td className="px-4 py-2.5 text-right font-medium tabular-nums">{fmt(amt)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Recent transactions */}
            <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-foreground">Recent Transactions</h2>
                    <div className="flex gap-3 text-xs text-muted-foreground">
                        <Link href="/school/finance/income" className="hover:text-foreground transition-colors">View income →</Link>
                        <Link href="/school/finance/expense" className="hover:text-foreground transition-colors">View expenses →</Link>
                    </div>
                </div>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-border bg-muted/40">
                            <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Date</th>
                            <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Description</th>
                            <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Category</th>
                            <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Type</th>
                            <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recent.length === 0 ? (
                            <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground text-xs">No transactions yet.</td></tr>
                        ) : (
                            recent.map((r: any) => (
                                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                                    <td className="px-4 py-2.5 text-muted-foreground tabular-nums whitespace-nowrap">
                                        {format(new Date(r.date), 'dd MMM yyyy')}
                                    </td>
                                    <td className="px-4 py-2.5 text-foreground max-w-[200px] truncate">
                                        {r.description || r.source || '—'}
                                    </td>
                                    <td className="px-4 py-2.5 text-muted-foreground">{r.category}</td>
                                    <td className="px-4 py-2.5">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                            r._type === 'Income'
                                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                                                : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                                        }`}>
                                            {r._type}
                                        </span>
                                    </td>
                                    <td className={`px-4 py-2.5 text-right font-medium tabular-nums ${
                                        r._type === 'Income' ? 'text-foreground' : 'text-foreground'
                                    }`}>
                                        {r._type === 'Income' ? '+' : '−'}{fmt(Number(r.amount))}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
