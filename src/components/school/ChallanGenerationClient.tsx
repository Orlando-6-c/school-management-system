// src/components/school/ChallanGenerationClient.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChallanStudentTable } from '@/components/school/ChallanStudentTable';
import { generateChallansByFilter } from '@/actions/finance';
import { PDFDownloadLink } from '@react-pdf/renderer';
import ChallanPdfDocument from './ChallanPdfDocument'; // Correct import path
import { format } from 'date-fns';

// Define types for our data
interface Class {
  id: string;
  name: string;
  section: string | null;
}

interface Student {
  id: string;
  name: string;
  rollNumber: string;
  class: {
    id: string;
    name: string;
    section: string | null;
  } | null;
}

interface FeeBreakdownItem {
    description: string;
    amount: number;
}

interface AdditionalChargeItem {
    additionalCharge: {
        name: string;
    };
    amountApplied: number;
}

interface GeneratedChallan {
    id: string;
    challanNumber: string;
    studentId: string;
    month: string;
    year: number;
    issueDate: string; // Use string for serialization
    dueDate: string;   // Use string for serialization
    totalAmount: number;
    amount: number; // Base tuition amount
    discount: number; // Discount amount
    lateFeeAmount: number;
    paidAmount: number;
    status: string; // Assuming FeeStatus enum
    isGenerated: boolean;
    schoolId: string;
    
    // Relations included from backend
    student: {
        id: string;
        name: string;
        rollNumber: string;
        class: {
            id: string;
            name: string;
            section: string | null;
        } | null;
    };
    feeBreakdown: FeeBreakdownItem[];
    additionalCharges: AdditionalChargeItem[];
}


interface ChallanGenerationClientProps {
    initialKlasses: Class[];
    initialStudents: Student[];
    initialSchoolName: string; // Add school name to props
}

export function ChallanGenerationClient({ initialKlasses, initialStudents, initialSchoolName }: ChallanGenerationClientProps) {
  const [klasses] = useState<Class[]>(initialKlasses);
  const [students] = useState<Student[]>(initialStudents); // Full list of students for client-side filtering
  const [filteredStudents, setFilteredStudents] = useState<Student[]>(initialStudents);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedFeeStatus, setSelectedFeeStatus] = useState<string>('all');
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [generatedChallansData, setGeneratedChallansData] = useState<GeneratedChallan[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // useEffect to apply filters
  useEffect(() => {
    let tempStudents = students;

    if (selectedClass !== 'all') {
      tempStudents = tempStudents.filter(student => student.class?.id === selectedClass);
    }
    
    // TODO: Implement fee status filtering when data is available
    // if (selectedFeeStatus !== 'all') {
    //   // tempStudents = tempStudents.filter(...)
    // }

    setFilteredStudents(tempStudents);
    // Reset selection when filters change
    setSelectedStudents(new Set());
    setGeneratedChallansData(null); // Clear generated data on filter change
  }, [selectedClass, selectedFeeStatus, students]);
  
  const handleSelectionChange = (newSelection: Set<string>) => {
    setSelectedStudents(newSelection);
    setGeneratedChallansData(null); // Clear generated data on selection change
  };

  const handleGeneratePdf = async () => {
    setIsGeneratingPdf(true);
    setErrorMessage(null);
    setGeneratedChallansData(null);

    if (selectedStudents.size === 0) {
        setErrorMessage('Please select at least one student.');
        setIsGeneratingPdf(false);
        return;
    }

    // Placeholder for month, year, and dueDate - ideally these would come from UI inputs
    const currentMonth = format(new Date(), 'MMMM'); // e.g., "January"
    const currentYear = new Date().getFullYear();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 15); // Due date 15 days from now

    try {
        const result = await generateChallansByFilter(
            selectedClass === 'all' ? undefined : selectedClass, // Pass classId if not 'all'
            selectedFeeStatus === 'all' ? undefined : selectedFeeStatus, // Pass feeStatus if not 'all'
            currentMonth,
            currentYear,
            dueDate
        );

        if (result.success && result.generatedChallans) {
            // Filter generatedChallans by selectedStudents and map to PDF-ready format
            const finalChallansForPdf = result.generatedChallans
                .filter(challan => selectedStudents.has(challan.student.id))
                .map(challan => ({
                    ...challan,
                    totalAmount: Number(challan.totalAmount),
                    amount: Number(challan.amount),
                    discount: Number(challan.discount),
                    lateFeeAmount: Number(challan.lateFeeAmount),
                    paidAmount: Number(challan.paidAmount),
                    issueDate: challan.issueDate.toString(), // Convert to string for ChallanPdfDocument
                    dueDate: challan.dueDate.toString(),     // Convert to string for ChallanPdfDocument
                    schoolName: initialSchoolName, // Pass school name from props
                    feeBreakdown: challan.feeBreakdown.map(item => ({ // Ensure numbers
                        description: item.description,
                        amount: Number(item.amount),
                    })),
                    additionalCharges: challan.additionalCharges.map(item => ({ // Ensure numbers
                        additionalCharge: { name: item.additionalCharge.name },
                        amountApplied: Number(item.amountApplied),
                    })),
                }));

            if (finalChallansForPdf.length === 0) {
                setErrorMessage('No challans generated for the selected students based on the filters.');
            } else {
                setGeneratedChallansData(finalChallansForPdf as GeneratedChallan[]);
            }

        } else {
            setErrorMessage(result.message || 'Failed to generate challans.');
        }
    } catch (error: any) {
        console.error('PDF Generation Error:', error);
        setErrorMessage(error.message || 'An unexpected error occurred during PDF generation.');
    } finally {
        setIsGeneratingPdf(false);
    }
  };


  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Challan Generation</h1>
        <p className="text-sm text-muted-foreground">
            Selected Students: {selectedStudents.size}
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Filter Students</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="class">Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger id="class">
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {klasses.map((klass) => (
                    <SelectItem key={klass.id} value={klass.id}>
                      {klass.name} {klass.section ? `(${klass.section})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fee-status">Fee Status</Label>
              <Select value={selectedFeeStatus} onValueChange={setSelectedFeeStatus}>
                <SelectTrigger id="fee-status">
                  <SelectValue placeholder="Select fee status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Select Students</CardTitle>
        </CardHeader>
        <CardContent>
          <ChallanStudentTable 
            students={filteredStudents}
            selectedStudents={selectedStudents}
            onSelectionChange={handleSelectionChange}
          />
        </CardContent>
      </Card>
      
      {errorMessage && (
          <p className="text-red-500 text-sm">{errorMessage}</p>
      )}

      <div className="flex justify-end gap-2">
        <Button 
            size="lg" 
            onClick={handleGeneratePdf} 
            disabled={selectedStudents.size === 0 || isGeneratingPdf}
        >
          {isGeneratingPdf ? 'Generating...' : `Generate Challan for ${selectedStudents.size} Student(s)`}
        </Button>
        {generatedChallansData && generatedChallansData.length > 0 && (
            <PDFDownloadLink 
                document={
                    <ChallanPdfDocument 
                        challanData={generatedChallansData[0]} // Pass the first generated challan data
                    />
                } 
                fileName={`challan_${generatedChallansData[0]?.challanNumber || format(new Date(), 'yyyyMMdd_HHmm')}.pdf`}
            >
                {({ loading }) => (
                    <Button size="lg" disabled={loading}>
                        {loading ? 'Preparing PDF...' : 'Download PDF'}
                    </Button>
                )}
            </PDFDownloadLink>
        )}
      </div>
    </div>
  );
}
