'use client';

import * as React from 'react';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function PrintDirectoryButton({ classes }: { classes: any[] }) {
    const [selectedClassId, setSelectedClassId] = React.useState<string>('all');
    const [open, setOpen] = React.useState(false);

    const handlePrint = () => {
        let url = '/school/students/print-batch';
        if (selectedClassId && selectedClassId !== 'all') {
            url += `?classId=${selectedClassId}`;
        }
        window.open(url, '_blank');
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Printer className="mr-2 h-4 w-4" />
                    Print Directory
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Print Student Directory</DialogTitle>
                    <DialogDescription>
                        Select filtering options for batch printing.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex items-center space-x-2 py-4">
                    <div className="grid flex-1 gap-2">
                        <Label htmlFor="class-filter">Filter by Class</Label>
                        <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                            <SelectTrigger id="class-filter">
                                <SelectValue placeholder="All Classes" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Classes</SelectItem>
                                {classes.map((c) => (
                                    <SelectItem key={c.id} value={c.id}>
                                        {c.name} {c.section ? `(${c.section})` : ''}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter className="sm:justify-end gap-2">
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">
                            Cancel
                        </Button>
                    </DialogClose>
                    <Button type="button" onClick={handlePrint}>
                        Print Records
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
