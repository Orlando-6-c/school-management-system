import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { hasPermission, userCan, getCurrentUserWithPermissions } from '@/lib/authz';
import { getStaff } from '@/actions/staff';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil } from 'lucide-react';
import { DeleteStaffButton } from '@/components/school/DeleteStaffButton';

export const runtime = 'nodejs';

export default async function StaffPage() {
    const session = await getSession();
    if (!session.schoolId) redirect('/login');
    if (!(await hasPermission('staff', 'view'))) redirect('/school');

    const actor = await getCurrentUserWithPermissions();
    const canCreate = actor ? userCan(actor, 'staff', 'create') : false;
    const canEdit = actor ? userCan(actor, 'staff', 'edit') : false;
    const canDelete = actor ? userCan(actor, 'staff', 'delete') : false;

    const staff = await getStaff();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Staff</h1>
                    <p className="text-muted-foreground mt-1">Non-teaching staff members.</p>
                </div>
                {canCreate && (
                    <Button asChild>
                        <Link href="/school/staff/new"><Plus className="h-4 w-4 mr-2" />Add Staff</Link>
                    </Button>
                )}
            </div>

            <Card className="border-border shadow-sm">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="pl-4">Name</TableHead>
                                <TableHead>Role / Designation</TableHead>
                                <TableHead>CNIC</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Gender</TableHead>
                                <TableHead>Hours</TableHead>
                                {(canEdit || canDelete) && <TableHead className="text-right pr-4">Actions</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {staff.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                                        No staff members found.{canCreate && <> <Link href="/school/staff/new" className="text-primary underline">Add one now.</Link></>}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                staff.map((s) => (
                                    <TableRow key={s.id}>
                                        <TableCell className="pl-4 font-medium">{s.name}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{s.role}</Badge>
                                        </TableCell>
                                        <TableCell className="font-mono text-sm">{s.cnic}</TableCell>
                                        <TableCell className="text-sm">{s.contact}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{s.gender}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{s.workingHours}</TableCell>
                                        {(canEdit || canDelete) && (
                                            <TableCell className="text-right pr-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    {canEdit && (
                                                        <Button variant="ghost" size="sm" asChild>
                                                            <Link href={`/school/staff/${s.id}/edit`}><Pencil className="h-3.5 w-3.5" /></Link>
                                                        </Button>
                                                    )}
                                                    {canDelete && <DeleteStaffButton staffId={s.id} staffName={s.name} />}
                                                </div>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
