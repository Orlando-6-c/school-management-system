import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export default function ClassesLoading() {
    return (
        <div className="space-y-6">
            <div>
                <Skeleton className="h-9 w-52" />
                <Skeleton className="h-4 w-72 mt-2" />
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-1 space-y-4">
                    <Skeleton className="h-[360px] w-full rounded-lg" />
                </div>
                <div className="lg:col-span-2 space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Card key={i}>
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-3 w-48" />
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <Skeleton className="h-8 w-8 rounded" />
                                    <Skeleton className="h-8 w-8 rounded" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
