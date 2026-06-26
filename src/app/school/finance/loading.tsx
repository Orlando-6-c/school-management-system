import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function FinanceLoading() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <Skeleton className="h-9 w-52" />
                <div className="flex gap-2">
                    <Skeleton className="h-9 w-32" />
                    <Skeleton className="h-9 w-36" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {['green', 'red', 'blue'].map((color, i) => (
                    <Card key={i} className={`border-l-4 border-l-${color}-500 shadow-sm`}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-4 rounded" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-36" />
                            <Skeleton className="h-3 w-24 mt-2" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="shadow-sm">
                <CardHeader>
                    <Skeleton className="h-5 w-44" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex items-center gap-4">
                                    <Skeleton className="h-8 w-8 rounded-full" />
                                    <div className="space-y-1.5">
                                        <Skeleton className="h-4 w-36" />
                                        <Skeleton className="h-3 w-28" />
                                    </div>
                                </div>
                                <Skeleton className="h-5 w-20" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
