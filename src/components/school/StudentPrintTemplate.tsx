import React from 'react';

export default function StudentPrintTemplate({ student }: { student: any }) {
    return (
        <div className="print-page p-8 max-w-3xl mx-auto bg-card border-b border-border pb-8 mb-8 page-break-after-always print:border-none print:shadow-none">
            {/* Header */}
            <div className="flex justify-between items-start mb-8 border-b pb-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">{student.school?.name || 'Green Valley High'}</h1>
                    <p className="text-sm text-muted-foreground">Official Student Record</p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-muted-foreground">Printed On: {new Date().toLocaleDateString()}</p>
                </div>
            </div>
            {/* Profile Section */}
            <div className="flex gap-8 mb-8">
                <div className="w-32 h-32 flex-shrink-0 bg-secondary rounded-lg overflow-hidden border border-border">
                    {student.photograph ? (
                        <img src={student.photograph} alt="Student" className="w-full h-full object-cover" />
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-400 text-xs">No Photo</div>
                    )}
                </div>
                <div className="flex-1 grid grid-cols-2 gap-4">
                    <div><span className="text-xs text-muted-foreground uppercase block">Full Name</span><p className="font-bold text-lg">{student.name}</p></div>
                    <div><span className="text-xs text-muted-foreground uppercase block">Roll Number</span><p className="font-mono">{student.rollNumber}</p></div>
                    <div><span className="text-xs text-muted-foreground uppercase block">Class</span><p>{student.class?.name || 'Unassigned'} {student.class?.section && `(${student.class.section})`}</p></div>
                    <div><span className="text-xs text-muted-foreground uppercase block">Gender</span><p>{student.gender}</p></div>
                    <div><span className="text-xs text-muted-foreground uppercase block">DOB</span><p>{new Date(student.dateOfBirth).toLocaleDateString()}</p></div>
                    <div><span className="text-xs text-muted-foreground uppercase block">Admission Date</span><p>{new Date(student.dateOfAdmission).toLocaleDateString()}</p></div>
                </div>
            </div>
            {/* Guardian & Fee Section */}
            <div className="grid grid-cols-2 gap-8">
                <div className="p-4 bg-muted rounded-lg border border-gray-100 print:border-border">
                    <h3 className="font-semibold mb-3 border-b pb-2">Guardian Details</h3>
                    <div className="space-y-2 text-sm">
                        <p><span className="text-muted-foreground">Name:</span> {student.guardian?.name}</p>
                        <p><span className="text-muted-foreground">Relation:</span> {student.guardian?.relation}</p>
                        <p><span className="text-muted-foreground">Contact:</span> {student.guardian?.contact}</p>
                        <p><span className="text-muted-foreground">CNIC:</span> {student.guardian?.cnic}</p>
                    </div>
                </div>
                <div className="p-4 bg-muted rounded-lg border border-gray-100 print:border-border">
                    <h3 className="font-semibold mb-3 border-b pb-2">Financial Status</h3>
                    <div className="space-y-2 text-sm">
                        <p><span className="text-muted-foreground">Monthly Fee:</span> {Number(student.monthlyFees).toLocaleString()}</p>
                        <p><span className="text-muted-foreground">Discount:</span> {Number(student.discountPercentage)}%</p>
                        <p className="text-lg font-bold mt-2 pt-2 border-t border-border">
                            Net Payable: {Number(student.finalFee).toLocaleString()}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
