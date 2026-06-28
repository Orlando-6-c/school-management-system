import { getAllSubscriptions } from '@/actions/subscription';
import { PLANS, getTrialDaysLeft } from '@/lib/plans';
import { UpdatePlanDialog } from '@/components/admin/UpdatePlanDialog';
import { CheckCircle2, AlertTriangle, XCircle, Clock } from 'lucide-react';

export const runtime = 'nodejs';

function StatusBadge({ status, trialEndsAt }: { status: string; trialEndsAt: Date | null }) {
    if (status === 'Active') {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="h-3 w-3" /> Active
            </span>
        );
    }
    if (status === 'Trial') {
        const days = trialEndsAt ? getTrialDaysLeft(trialEndsAt) : 0;
        const isExpired = days <= 0;
        return isExpired ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                <XCircle className="h-3 w-3" /> Trial expired
            </span>
        ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                <Clock className="h-3 w-3" /> Trial ({days}d left)
            </span>
        );
    }
    if (status === 'Expired' || status === 'Cancelled') {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                <XCircle className="h-3 w-3" /> {status}
            </span>
        );
    }
    return <span className="text-muted-foreground text-xs">{status}</span>;
}

export default async function AdminBillingPage() {
    const rows = await getAllSubscriptions();

    const stats = {
        total: rows.length,
        trial: rows.filter((r) => r.status === 'Trial' && getTrialDaysLeft(r.trialEndsAt!) > 0).length,
        active: rows.filter((r) => r.status === 'Active').length,
        expired: rows.filter(
            (r) => r.status === 'Expired' || r.status === 'Cancelled' || (r.status === 'Trial' && getTrialDaysLeft(r.trialEndsAt!) <= 0),
        ).length,
        noSub: rows.filter((r) => !r.status).length,
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Billing</h1>
                <p className="text-muted-foreground">Manage school subscriptions and plans.</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Schools', value: stats.total, color: 'text-sky-600' },
                    { label: 'On Trial', value: stats.trial, color: 'text-amber-600' },
                    { label: 'Active Plans', value: stats.active, color: 'text-emerald-600' },
                    { label: 'Expired / Cancelled', value: stats.expired, color: 'text-red-600' },
                ].map(({ label, value, color }) => (
                    <div key={label} className="bg-card rounded-xl border border-border shadow-sm p-4">
                        <p className="text-muted-foreground text-xs font-medium">{label}</p>
                        <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
                    </div>
                ))}
            </div>

            {/* Schools table */}
            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted border-b border-border">
                            <tr>
                                <th className="px-4 py-3 font-semibold text-muted-foreground">School</th>
                                <th className="px-4 py-3 font-semibold text-muted-foreground">Plan</th>
                                <th className="px-4 py-3 font-semibold text-muted-foreground">Status</th>
                                <th className="px-4 py-3 font-semibold text-muted-foreground">Students</th>
                                <th className="px-4 py-3 font-semibold text-muted-foreground">Users</th>
                                <th className="px-4 py-3 font-semibold text-muted-foreground">Trial / Period End</th>
                                <th className="px-4 py-3 font-semibold text-muted-foreground">Registered</th>
                                <th className="px-4 py-3 font-semibold text-muted-foreground text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {rows.map((row) => {
                                const plan = PLANS[row.plan];
                                const maxStudents = plan.maxStudents === Infinity ? '∞' : plan.maxStudents;
                                const maxUsers = plan.maxUsers === Infinity ? '∞' : plan.maxUsers;
                                const periodEnd = row.status === 'Trial' ? row.trialEndsAt : row.currentPeriodEnd;

                                return (
                                    <tr key={row.schoolId} className="hover:bg-muted/50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-foreground">{row.schoolName}</div>
                                            <div className="text-xs text-muted-foreground">{row.schoolSlug}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="font-medium text-foreground">{plan.label}</span>
                                            {row.notes && (
                                                <p className="text-xs text-muted-foreground truncate max-w-[120px]" title={row.notes}>
                                                    {row.notes}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <StatusBadge status={row.status} trialEndsAt={row.trialEndsAt} />
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {row.studentCount} / {maxStudents}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {row.userCount} / {maxUsers}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground text-xs">
                                            {periodEnd
                                                ? new Date(periodEnd).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })
                                                : '—'}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground text-xs">
                                            {new Date(row.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <UpdatePlanDialog
                                                schoolId={row.schoolId}
                                                schoolName={row.schoolName}
                                                currentPlan={row.plan}
                                                currentStatus={row.status}
                                                currentNotes={row.notes ?? ''}
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                            {rows.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                                        No schools yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
