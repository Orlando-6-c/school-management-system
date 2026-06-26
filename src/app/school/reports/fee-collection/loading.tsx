import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export default function FeeCollectionLoading() {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Skeleton className="h-9 w-48" />
                <Skeleton className="h-4 w-72" />
            </div>
            <div className="flex gap-3">
                <Skeleton className="h-9 w-36" />
                <Skeleton className="h-9 w-28" />
                <Skeleton className="h-9 w-24" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className={i >= 4 ? 'sm:col-span-2' : ''}>
                        <CardContent className="pt-4 pb-4">
                            <Skeleton className="h-3 w-24 mb-2" />
                            <Skeleton className="h-8 w-16" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
