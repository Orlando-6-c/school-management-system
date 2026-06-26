import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function TeachersLoading() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Skeleton className="h-9 w-56" />
                <Skeleton className="h-9 w-36" />
            </div>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-44" />
                            <Skeleton className="h-4 w-28" />
                        </div>
                        <Skeleton className="h-9 w-64" />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-border">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-4 px-4 py-3">
                                <Skeleton className="h-9 w-9 rounded-full" />
                                <div className="space-y-1.5 flex-1">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-3 w-24" />
                                </div>
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-4 w-28" />
                                <Skeleton className="h-8 w-16 ml-auto" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
