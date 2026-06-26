import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function SchoolDashboardLoading() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-9 w-72" />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i} className="shadow-sm">
                        <CardHeader className="pb-2">
                            <Skeleton className="h-4 w-24" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-16" />
                            <Skeleton className="h-3 w-20 mt-2" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Array.from({ length: 2 }).map((_, i) => (
                    <Card key={i} className="shadow-sm">
                        <CardHeader>
                            <Skeleton className="h-5 w-36" />
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {Array.from({ length: 4 }).map((_, j) => (
                                    <div key={j} className="flex items-center gap-3">
                                        <Skeleton className="h-8 w-8 rounded-full" />
                                        <div className="flex-1 space-y-1.5">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-3 w-24" />
                                        </div>
                                        <Skeleton className="h-4 w-12" />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
