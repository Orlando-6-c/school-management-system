import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export default function AttendanceLoading() {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Skeleton className="h-9 w-40" />
                <Skeleton className="h-4 w-72" />
            </div>
            <div className="flex gap-2">
                <Skeleton className="h-9 w-36" />
                <Skeleton className="h-9 w-36" />
            </div>
            <Card>
                <CardContent className="pt-4 pb-4">
                    <Skeleton className="h-9 w-56" />
                </CardContent>
            </Card>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i}>
                        <CardContent className="pt-4 pb-4">
                            <Skeleton className="h-3 w-16 mb-2" />
                            <Skeleton className="h-9 w-12" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
