'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaginationControlsProps {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    pageSize: number;
}

export function PaginationControls({ currentPage, totalPages, totalCount, pageSize }: PaginationControlsProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    if (totalPages <= 1) return null;

    function goTo(page: number) {
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', String(page));
        startTransition(() => router.replace(`${pathname}?${params.toString()}`));
    }

    const from = (currentPage - 1) * pageSize + 1;
    const to = Math.min(currentPage * pageSize, totalCount);

    return (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-sm text-muted-foreground">
                Showing <span className="font-medium">{from}–{to}</span> of <span className="font-medium">{totalCount}</span>
            </p>
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goTo(currentPage - 1)}
                    disabled={currentPage <= 1 || isPending}
                >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                </Button>
                <span className="text-sm text-muted-foreground px-2">
                    Page {currentPage} of {totalPages}
                </span>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goTo(currentPage + 1)}
                    disabled={currentPage >= totalPages || isPending}
                >
                    Next
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
