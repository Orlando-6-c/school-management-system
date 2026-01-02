import { getSession } from '@/lib/session';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, GraduationCap, BookOpen, ArrowUpRight } from 'lucide-react'; // Added ArrowUpRight for flair

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
            color: "text-blue-600",
            bg: "bg-blue-50"
        },
        {
            title: "Total Teachers",
            value: "0",
            icon: Users,
            description: "Registered staff",
            color: "text-emerald-600",
            bg: "bg-emerald-50"
        },
        {
            title: "Active Classes",
            value: "0",
            icon: BookOpen,
            description: "Current academic year",
            color: "text-violet-600",
            bg: "bg-violet-50"
        }
    ];

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
                    <p className="text-gray-500 mt-2 text-lg">
                        Welcome back, <span className="font-semibold text-gray-800">{session.username}</span>!
                    </p>
                </div>
                <div className="text-sm text-gray-400">
                    {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {stats.map((stat, index) => (
                    <Card key={index} className="border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">
                                {stat.title}
                            </CardTitle>
                            <div className={`p-2 rounded-lg ${stat.bg}`}>
                                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                            <div className="flex items-center mt-1 text-xs text-gray-500">
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

            {/* Quick Actions or Recent Activity Placeholder */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-gray-100 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg text-gray-800">Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-gray-500 py-8 text-center italic">
                            No recent activity to show.
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-gray-100 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg text-gray-800">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-gray-500 py-8 text-center italic">
                            Shortcuts coming soon.
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
