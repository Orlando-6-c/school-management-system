import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import db from '@/lib/db';
import { getBulkChallans } from '@/actions/finance';
import AutoPrint from '@/app/school/students/[id]/print/auto-print';
import PrintButton from '@/app/school/finance/challan/[id]/print/print-button';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';

const DEFAULT_POLICY = `1. Fee is due by the due date shown on this challan. Late payments may attract additional charges.
2. Fee once paid is non-refundable under any circumstances.
3. Always obtain a receipt from the cashier after payment.
4. Payments must be made to the designated bank account only.
5. For queries regarding fee, contact the school accounts office during working hours.`;

function fmt(n: number | string | null | undefined) {
    return 'Rs ' + Number(n ?? 0).toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function Slip({
    challan,
    school,
    bankAccounts,
    policy,
    copyLabel,
}: {
    challan: any;
    school: any;
    bankAccounts: any[];
    policy: string;
    copyLabel: string;
}) {
    const isPaid = challan.status === 'Paid';
    const policyLines = policy.split('\n').map((l: string) => l.trim()).filter(Boolean);

    return (
        <div className="border border-gray-700 flex flex-col text-[8.5pt] leading-snug" style={{ height: '100%' }}>
            <div className="bg-gray-800 text-white text-center text-[7pt] font-bold uppercase tracking-widest py-0.5">
                {copyLabel}
            </div>
            <div className="text-center border-b border-gray-400 px-2 py-1.5">
                <p className="font-bold text-[10pt] uppercase leading-tight">{school.name}</p>
                {school.address && <p className="text-gray-600 text-[7pt]">{school.address}</p>}
                {school.phone && <p className="text-gray-600 text-[7pt]">Tel: {school.phone}</p>}
                <p className="font-semibold text-[8pt] mt-0.5">FEE CHALLAN — {challan.month} {challan.year}</p>
            </div>
            <div className="flex justify-between items-center px-2 py-1 border-b border-gray-300 bg-gray-50">
                <div>
                    <p className="text-[6.5pt] text-gray-500 uppercase font-semibold">Challan / PSID</p>
                    <p className="font-mono font-bold text-[8.5pt]">{challan.challanNumber}</p>
                </div>
                <div className="text-right">
                    <p className="text-[6.5pt] text-gray-500 uppercase font-semibold">Status</p>
                    <p className={`font-bold text-[8.5pt] ${isPaid ? 'text-green-700' : 'text-amber-700'}`}>
                        {challan.status}
                    </p>
                </div>
            </div>
            <div className="px-2 py-1 border-b border-gray-300 grid grid-cols-2 gap-x-2 gap-y-0.5">
                <div>
                    <p className="text-[6.5pt] text-gray-500">Student</p>
                    <p className="font-semibold">{challan.student.name}</p>
                </div>
                <div>
                    <p className="text-[6.5pt] text-gray-500">Roll No.</p>
                    <p className="font-semibold">{challan.student.rollNumber}</p>
                </div>
                <div>
                    <p className="text-[6.5pt] text-gray-500">Class</p>
                    <p className="font-semibold">
                        {challan.student.class?.name ?? '—'}{challan.student.class?.section ? ` (${challan.student.class.section})` : ''}
                    </p>
                </div>
                <div>
                    <p className="text-[6.5pt] text-gray-500">Guardian</p>
                    <p className="font-semibold">{challan.student.guardian?.name ?? '—'}</p>
                </div>
                <div>
                    <p className="text-[6.5pt] text-gray-500">Issue Date</p>
                    <p>{format(new Date(challan.issueDate), 'dd MMM yyyy')}</p>
                </div>
                <div>
                    <p className="text-[6.5pt] text-gray-500">Due Date</p>
                    <p className="font-semibold">{format(new Date(challan.dueDate), 'dd MMM yyyy')}</p>
                </div>
            </div>
            <div className="flex-1 px-2 py-1">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-400">
                            <th className="text-left text-[6.5pt] font-semibold text-gray-600 pb-0.5">Description</th>
                            <th className="text-right text-[6.5pt] font-semibold text-gray-600 pb-0.5">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {challan.feeBreakdown.map((item: any) => (
                            <tr key={item.id} className="border-b border-gray-100">
                                <td className="py-0.5 text-gray-700">{item.description}</td>
                                <td className={`py-0.5 text-right tabular-nums ${Number(item.amount) < 0 ? 'text-green-700' : ''}`}>
                                    {Number(item.amount) < 0
                                        ? `(${fmt(Math.abs(Number(item.amount)))})`
                                        : fmt(item.amount)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="border-t-2 border-gray-700">
                            <td className="pt-1 font-bold text-[9pt]">Total Due</td>
                            <td className="pt-1 text-right font-bold tabular-nums text-[9pt]">{fmt(challan.totalAmount)}</td>
                        </tr>
                        {isPaid && (
                            <tr>
                                <td className="text-green-700 font-medium">Amount Paid</td>
                                <td className="text-right text-green-700 font-medium tabular-nums">{fmt(challan.paidAmount)}</td>
                            </tr>
                        )}
                    </tfoot>
                </table>
            </div>
            {bankAccounts.length > 0 && (
                <div className="px-2 py-1 border-t border-gray-300 bg-gray-50">
                    <p className="text-[6.5pt] font-semibold text-gray-600 uppercase mb-0.5">Pay To</p>
                    {bankAccounts.map((b: any) => (
                        <div key={b.id} className="flex justify-between text-[7.5pt]">
                            <span className="font-medium">{b.bankName} — {b.accountTitle}</span>
                            <span className="font-mono">{b.accountNumber}</span>
                        </div>
                    ))}
                </div>
            )}
            {isPaid ? (
                <div className="mx-2 mb-1.5 mt-1 border-2 border-green-600 text-green-700 font-bold text-center text-[9pt] uppercase tracking-widest py-0.5 rounded">
                    PAID {challan.paidAt ? `— ${format(new Date(challan.paidAt), 'dd MMM yyyy')}` : ''}
                </div>
            ) : (
                <div className="px-2 pb-1.5 pt-1 flex justify-between text-[6.5pt] text-gray-500 border-t border-gray-300">
                    <span>Bank Stamp / Date</span>
                    <span>Cashier Signature</span>
                </div>
            )}
            <div className="px-2 pb-1.5 border-t border-gray-200">
                <p className="text-[6pt] font-semibold text-gray-500 uppercase mb-0.5">Terms &amp; Conditions</p>
                {policyLines.map((line: string, i: number) => (
                    <p key={i} className="text-[6pt] text-gray-500 leading-tight">{line}</p>
                ))}
            </div>
        </div>
    );
}

export default async function BulkPrintPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
    const session = await getSession();
    if (!session?.schoolId) redirect('/login');

    const sp = searchParams as Record<string, string | undefined>;
    const studentIds = sp.sids ? sp.sids.split(',').filter(Boolean) : [];
    const classIds = sp.cids ? sp.cids.split(',').filter(Boolean) : [];

    if (!studentIds.length && !classIds.length) {
        return (
            <div className="p-8 text-center text-muted-foreground">
                No students or classes selected. Close this tab and use the Bulk Print button on the challans page.
            </div>
        );
    }

    const [challans, school, bankAccounts, policyRows] = await Promise.all([
        getBulkChallans({
            studentIds: studentIds.length ? studentIds : undefined,
            classIds: classIds.length ? classIds : undefined,
            month: sp.month,
            year: sp.year ? Number(sp.year) : undefined,
            status: sp.status,
        }),
        db.school.findUnique({
            where: { id: session.schoolId },
            select: { name: true, address: true, phone: true },
        }),
        (db as any).bankAccount.findMany({
            where: { schoolId: session.schoolId },
            orderBy: { isDefault: 'desc' },
        }),
        db.$queryRaw<{ feePaymentPolicy: string | null }[]>`
            SELECT "feePaymentPolicy" FROM "School" WHERE id = ${session.schoolId}
        `,
    ]);

    const policy = policyRows[0]?.feePaymentPolicy ?? DEFAULT_POLICY;
    const copies = ['Bank Copy', 'School Copy', 'Student Copy'] as const;

    if (!challans.length) {
        return (
            <div className="p-8 text-center text-muted-foreground">
                No challans found for the selected filters. Close this tab and adjust your selection.
            </div>
        );
    }

    return (
        <>
            <style>{`
                @page { size: A4 landscape; margin: 8mm; }
                @media print {
                    body { margin: 0; background: white; }
                    .print-instructions { display: none !important; }
                    .challan-page { page-break-after: always; }
                    .challan-page:last-child { page-break-after: avoid; }
                }
            `}</style>

            <AutoPrint />

            <div className="print-instructions flex items-center justify-between px-6 py-3 border-b bg-muted/40">
                <p className="text-sm text-muted-foreground">
                    {challans.length} challan{challans.length !== 1 ? 's' : ''} — each prints on its own landscape page with 3 copies.
                </p>
                <PrintButton />
            </div>

            {/* One landscape page per challan, 3 copies side by side */}
            {(challans as any[]).map((challan) => (
                <div
                    key={challan.id}
                    className="challan-page grid gap-0"
                    style={{
                        gridTemplateColumns: '1fr 1fr 1fr',
                        height: 'calc(210mm - 16mm)',
                    }}
                >
                    {copies.map((label, i) => (
                        <div
                            key={label}
                            style={{
                                borderRight: i < 2 ? '2px dashed #9ca3af' : undefined,
                                paddingLeft: i > 0 ? '4mm' : undefined,
                                paddingRight: i < 2 ? '4mm' : undefined,
                                height: '100%',
                            }}
                        >
                            <Slip
                                challan={challan}
                                school={school}
                                bankAccounts={bankAccounts}
                                policy={policy}
                                copyLabel={label}
                            />
                        </div>
                    ))}
                </div>
            ))}
        </>
    );
}
