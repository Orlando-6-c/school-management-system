import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function ParentsLoading() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-9 w-52" />
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-44" />
                            <Skeleton className="h-4 w-64" />
                        </div>
                        <Skeleton className="h-9 w-60" />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-border">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-4 px-4 py-4">
                                <Skeleton className="h-4 w-32" />
                                <div className="space-y-1.5">
                                    <Skeleton className="h-4 w-28" />
                                    <Skeleton className="h-3 w-36" />
                                </div>
                                <Skeleton className="h-12 w-40" />
                                <div className="ml-auto space-y-1.5">
                                    <Skeleton className="h-4 w-28" />
                                    <Skeleton className="h-3 w-20" />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
