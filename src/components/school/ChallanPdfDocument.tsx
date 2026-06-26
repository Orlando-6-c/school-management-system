// src/components/school/ChallanPdfDocument.tsx
import React from 'react';
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';

// Define types for challan data
interface ChallanDataItem {
    description: string;
    amount: number;
}

interface ChallanData {
    challanNumber: string;
    studentName: string;
    rollNumber: string;
    className: string;
    sectionName?: string;
    month: string;
    year: number;
    issueDate: string;
    dueDate: string;
    feeBreakdown: ChallanDataItem[];
    totalAmount: number;
    schoolName: string;
}

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#ffffff',
        padding: 20,
    },
    section: {
        margin: 10,
        padding: 10,
        flexGrow: 1,
        border: '1pt solid #000000',
        position: 'relative', // Needed for absolute positioning of copy text
    },
    dashedLine: {
        borderBottomWidth: 1,
        borderStyle: 'dashed',
        marginVertical: 5,
    },
    header: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 5,
        fontWeight: 'bold',
    },
    subHeader: {
        fontSize: 12,
        textAlign: 'center',
        marginBottom: 10,
    },
    text: {
        fontSize: 10,
        marginBottom: 3,
    },
    table: {
        width: 'auto',
        marginBottom: 10,
    },
    tableRow: {
        margin: 'auto',
        flexDirection: 'row',
    },
    tableColHeader: {
        width: '70%',
        borderStyle: 'solid',
        borderBottomColor: '#000000',
        borderBottomWidth: 1,
        padding: 5,
        fontSize: 10,
        fontWeight: 'bold',
    },
    tableColHeaderAmount: {
        width: '30%',
        borderStyle: 'solid',
        borderBottomColor: '#000000',
        borderBottomWidth: 1,
        padding: 5,
        fontSize: 10,
        fontWeight: 'bold',
        textAlign: 'right',
    },
    tableCol: {
        width: '70%',
        borderStyle: 'solid',
        borderBottomColor: '#cccccc',
        borderBottomWidth: 0.5,
        padding: 5,
        fontSize: 9,
    },
    tableColAmount: {
        width: '30%',
        borderStyle: 'solid',
        borderBottomColor: '#cccccc',
        borderBottomWidth: 0.5,
        padding: 5,
        fontSize: 9,
        textAlign: 'right',
    },
    totalRow: {
        flexDirection: 'row',
        marginTop: 5,
    },
    totalLabel: {
        width: '70%',
        fontSize: 10,
        fontWeight: 'bold',
        padding: 5,
        textAlign: 'right',
    },
    totalAmount: {
        width: '30%',
        fontSize: 10,
        fontWeight: 'bold',
        padding: 5,
        textAlign: 'right',
    },
    copyText: {
        position: 'absolute',
        top: 5,
        right: 5,
        fontSize: 8,
        color: '#666666',
        transform: 'rotate(0deg)', // Keep normal orientation
        transformOrigin: '100% 0%',
    },
    footerText: {
        fontSize: 8,
        textAlign: 'center',
        marginTop: 10,
        color: '#666666',
    },
});

const ChallanCopy: React.FC<{ data: ChallanData; copyType: string }> = ({ data, copyType }) => (
    <View style={styles.section}>
        <Text style={styles.copyText}>{copyType} Copy</Text>
        <Text style={styles.header}>{data.schoolName}</Text>
        <Text style={styles.subHeader}>Fee Challan - {data.month} {data.year}</Text>

        <View style={{ marginBottom: 10 }}>
            <Text style={styles.text}>Challan No: {data.challanNumber}</Text>
            <Text style={styles.text}>Issue Date: {data.issueDate}</Text>
            <Text style={styles.text}>Due Date: {data.dueDate}</Text>
        </View>

        <View style={{ marginBottom: 10 }}>
            <Text style={styles.text}>Student Name: {data.studentName}</Text>
            <Text style={styles.text}>Roll No: {data.rollNumber}</Text>
            <Text style={styles.text}>Class: {data.className} {data.sectionName ? `(${data.sectionName})` : ''}</Text>
        </View>

        <View style={styles.table}>
            <View style={styles.tableRow}>
                <Text style={styles.tableColHeader}>Description</Text>
                <Text style={styles.tableColHeaderAmount}>Amount</Text>
            </View>
            {data.feeBreakdown.map((item, index) => (
                <View style={styles.tableRow} key={index}>
                    <Text style={styles.tableCol}>{item.description}</Text>
                    <Text style={styles.tableColAmount}>{item.amount.toFixed(2)}</Text>
                </View>
            ))}
        </View>

        <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount:</Text>
            <Text style={styles.totalAmount}>{data.totalAmount.toFixed(2)}</Text>
        </View>
        
        <Text style={styles.footerText}>Please pay by the due date to avoid late fees.</Text>
    </View>
);

const ChallanPdfDocument: React.FC<{ challanData: ChallanData }> = ({ challanData }) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <ChallanCopy data={challanData} copyType="School" />
            <View style={styles.dashedLine} />
            <ChallanCopy data={challanData} copyType="Parent" />
            <View style={styles.dashedLine} />
            <ChallanCopy data={challanData} copyType="Bank" />
        </Page>
    </Document>
);

export default ChallanPdfDocument;
