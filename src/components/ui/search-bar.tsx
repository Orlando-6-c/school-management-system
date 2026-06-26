'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useTransition } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface SearchBarProps {
    placeholder?: string;
    paramName?: string;
    className?: string;
}

export function SearchBar({ placeholder = 'Search…', paramName = 'search', className }: SearchBarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const params = new URLSearchParams(searchParams.toString());
            const value = e.target.value;
            if (value) {
                params.set(paramName, value);
            } else {
                params.delete(paramName);
            }
            params.delete('page'); // reset to page 1 on new search
            startTransition(() => {
                router.replace(`${pathname}?${params.toString()}`);
            });
        },
        [router, pathname, searchParams, paramName],
    );

    return (
        <div className={cn('relative', className)}>
            <Search className={cn('absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none', isPending && 'animate-pulse')} />
            <Input
                defaultValue={searchParams.get(paramName) ?? ''}
                onChange={handleChange}
                placeholder={placeholder}
                className="pl-9"
            />
        </div>
    );
}
