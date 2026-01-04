import { getSession } from '@/lib/session';
import db from '@/lib/db';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, GraduationCap, BookOpen, ArrowUpRight } from 'lucide-react';

export const runtime = 'nodejs';

export default async function SchoolDashboard() {
    const session = await getSession();

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
