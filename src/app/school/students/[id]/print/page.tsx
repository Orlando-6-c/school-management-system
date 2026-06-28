import { notFound, redirect } from 'next/navigation';
import db from '@/lib/db';
import { getSession } from '@/lib/session';
import AutoPrint from './auto-print'; // Client component for window.print()

export default async function PrintStudentPage({ params }: { params: { id: string } }) {
    const session = await getSession();
    if (!session.schoolId) redirect('/login');

    const { id } = params;

    const student = await db.student.findUnique({
        where: { id, schoolId: session.schoolId },
        include: {
            guardian: true,
            class: true,
            school: true // Fetch school name for header
        }
    });

    if (!student) notFound();

    return (
        <div className="bg-card p-8 max-w-4xl mx-auto print:p-0">
            <AutoPrint />

            {/* Header */}
            <div className="text-center border-b-2 border-slate-800 pb-4 mb-8">
                <h1 className="text-3xl font-bold uppercase tracking-wider">{student.school.name}</h1>
                <p className="text-slate-600">{student.school.address || 'Address not available'}</p>
                <p className="text-slate-600">{student.school.phone || 'Contact not available'}</p>
            </div>

            <div className="grid grid-cols-3 gap-8">
                {/* Photo Section */}
                <div className="col-span-1">
                    <div className="aspect-[3/4] relative bg-slate-100 border border-slate-300 rounded overflow-hidden">
                        {student.photograph ? (
                            <img
                                src={student.photograph}
                                alt={student.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-400">
                                No Photo
                            </div>
                        )}
                    </div>
                    <div className="mt-4 text-center">
                        <h2 className="text-xl font-bold">{student.name}</h2>
                        <p className="text-slate-600">Roll No: {student.rollNumber}</p>
                        <p className="font-semibold mt-2">{student.class.name} {student.class.section && `(${student.class.section})`}</p>
                    </div>
                </div>

                {/* Details Section */}
                <div className="col-span-2 space-y-8">

                    {/* Student Info */}
                    <section>
                        <h3 className="text-lg font-bold border-b border-slate-300 mb-4 pb-1">Student Information</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="font-semibold block text-slate-500">Full Name</span>
                                {student.name}
                            </div>
                            <div>
                                <span className="font-semibold block text-slate-500">Gender</span>
                                {student.gender}
                            </div>
                            <div>
                                <span className="font-semibold block text-slate-500">Date of Birth</span>
                                {new Date(student.dateOfBirth).toLocaleDateString()}
                            </div>
                            <div>
                                <span className="font-semibold block text-slate-500">Admission Date</span>
                                {new Date(student.dateOfAdmission).toLocaleDateString()}
                            </div>
                            <div>
                                <span className="font-semibold block text-slate-500">B-Form / CNIC</span>
                                {student.bFormNumber}
                            </div>
                        </div>
                    </section>

                    {/* Guardian Info */}
                    <section>
                        <h3 className="text-lg font-bold border-b border-slate-300 mb-4 pb-1">Guardian Information</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="font-semibold block text-slate-500">Name</span>
                                {student.guardian.name}
                            </div>
                            <div>
                                <span className="font-semibold block text-slate-500">Relation</span>
                                {student.guardian.relation}
                            </div>
                            <div>
                                <span className="font-semibold block text-slate-500">CNIC</span>
                                {student.guardian.cnic}
                            </div>
                            <div>
                                <span className="font-semibold block text-slate-500">Contact</span>
                                {student.guardian.contact}
                            </div>
                            {student.guardian.email && (
                                <div className="col-span-2">
                                    <span className="font-semibold block text-slate-500">Email</span>
                                    {student.guardian.email}
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Financial Info */}
                    <section>
                        <h3 className="text-lg font-bold border-b border-slate-300 mb-4 pb-1">Financial Setup</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="font-semibold block text-slate-500">Monthly Tuition Details</span>
                                {Number(student.monthlyFees).toLocaleString()}
                            </div>
                            {Number(student.discountPercentage) > 0 && (
                                <>
                                    <div>
                                        <span className="font-semibold block text-slate-500">Discount</span>
                                        {Number(student.discountPercentage)}%
                                    </div>
                                    <div>
                                        <span className="font-semibold block text-slate-500">Net Fee</span>
                                        <span className="font-bold">{Number(student.finalFee).toLocaleString()}</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </section>
                </div>
            </div>

            <div className="fixed bottom-0 left-0 w-full text-center text-xs text-slate-400 p-4 print:hidden">
                <p>Press Ctrl+P to print if dialog doesn't appear.</p>
            </div>
        </div>
    );
}
