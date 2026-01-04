import React from 'react';

export default function StudentPrintTemplate({ student }: { student: any }) {
    return (
        <div className="print-page p-8 max-w-3xl mx-auto bg-white border-b border-gray-200 pb-8 mb-8 page-break-after-always print:border-none print:shadow-none">
            {/* Header */}
            <div className="flex justify-between items-start mb-8 border-b pb-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{student.school?.name || 'Green Valley High'}</h1>
                    <p className="text-sm text-gray-500">Official Student Record</p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-gray-500">Printed On: {new Date().toLocaleDateString()}</p>
                </div>
            </div>
            {/* Profile Section */}
            <div className="flex gap-8 mb-8">
                <div className="w-32 h-32 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                    {student.photograph ? (
                        <img src={student.photograph} alt="Student" className="w-full h-full object-cover" />
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-400 text-xs">No Photo</div>
                    )}
                </div>
                <div className="flex-1 grid grid-cols-2 gap-4">
                    <div><span className="text-xs text-gray-500 uppercase block">Full Name</span><p className="font-bold text-lg">{student.name}</p></div>
                    <div><span className="text-xs text-gray-500 uppercase block">Roll Number</span><p className="font-mono">{student.rollNumber}</p></div>
                    <div><span className="text-xs text-gray-500 uppercase block">Class</span><p>{student.class?.name || 'Unassigned'} {student.class?.section && `(${student.class.section})`}</p></div>
                    <div><span className="text-xs text-gray-500 uppercase block">Gender</span><p>{student.gender}</p></div>
                    <div><span className="text-xs text-gray-500 uppercase block">DOB</span><p>{new Date(student.dateOfBirth).toLocaleDateString()}</p></div>
                    <div><span className="text-xs text-gray-500 uppercase block">Admission Date</span><p>{new Date(student.dateOfAdmission).toLocaleDateString()}</p></div>
                </div>
            </div>
            {/* Guardian & Fee Section */}
            <div className="grid grid-cols-2 gap-8">
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 print:border-gray-200">
                    <h3 className="font-semibold mb-3 border-b pb-2">Guardian Details</h3>
                    <div className="space-y-2 text-sm">
                        <p><span className="text-gray-500">Name:</span> {student.guardian?.name}</p>
                        <p><span className="text-gray-500">Relation:</span> {student.guardian?.relation}</p>
                        <p><span className="text-gray-500">Contact:</span> {student.guardian?.contact}</p>
                        <p><span className="text-gray-500">CNIC:</span> {student.guardian?.cnic}</p>
                    </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 print:border-gray-200">
                    <h3 className="font-semibold mb-3 border-b pb-2">Financial Status</h3>
                    <div className="space-y-2 text-sm">
                        <p><span className="text-gray-500">Monthly Fee:</span> {Number(student.monthlyFees).toLocaleString()}</p>
                        <p><span className="text-gray-500">Discount:</span> {Number(student.discountPercentage)}%</p>
                        <p className="text-lg font-bold mt-2 pt-2 border-t border-gray-200">
                            Net Payable: {Number(student.finalFee).toLocaleString()}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
