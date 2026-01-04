'use client';

import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

interface PrintButtonProps {
    label?: string;
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
    size?: "default" | "sm" | "lg" | "icon";
    className?: string;
    icon?: boolean;
}

export default function PrintButton({ label = 'Print', variant = 'outline', size = 'default', className, icon = true }: PrintButtonProps) {
    return (
        <Button variant={variant} size={size} className={className} onClick={() => window.print()}>
            {icon && <Printer className={`h-4 w-4 ${label ? 'mr-2' : ''}`} />}
            {label}
        </Button>
    );
}
