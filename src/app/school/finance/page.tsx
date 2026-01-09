import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function FinancePage() {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Finance Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Total Income</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">$0.00</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Total Expense</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">$0.00</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Net Profit</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">$0.00</p>
                    </CardContent>
                </Card>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4">
                        {/* Placeholder for quick action buttons */}
                        <p>More features coming soon...</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
