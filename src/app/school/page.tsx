import { getSession } from '@/lib/session';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, GraduationCap, BookOpen } from 'lucide-react';

export const runtime = 'nodejs';

export default async function SchoolDashboard() {
    const session = await getSession();

    // Placeholder data - to be replaced with real DB counts later
    const stats = [
        {
            title: "Total Students",
            value: "0",
            icon: GraduationCap,
            description: "Active students",
            color: "text-blue-600"
        },
        {
            title: "Total Teachers",
            value: "0",
            icon: Users,
            description: "Registered staff",
            color: "text-emerald-600"
        },
        {
            title: "Active Classes",
            value: "0",
            icon: BookOpen,
            description: "Current academic year",
            color: "text-indigo-600"
        }
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
                <p className="text-gray-500 mt-2">
                    Overview of your school's performance.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {stats.map((stat, index) => (
                    <Card key={index} className="border-gray-200 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500">
                                {stat.title}
                            </CardTitle>
                            <stat.icon className={`h-4 w-4 ${stat.color}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                            <p className="text-xs text-gray-500 mt-1">
                                {stat.description}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50/50">
                <p className="text-gray-500 text-sm">
                    More widgets and charts coming soon...
                </p>
            </div>
        </div>
    );
}
