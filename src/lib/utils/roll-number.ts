/**
 * Generates a Roll Number based on SRS 3.2.2
 * Format: YY + Sequence(3) + Grade(Hex)
 * Example: 26 + 001 + A = 260010A
 * 
 * @param gradeHex The hexadecimal code for the grade/class
 * @param admissionDate The date of admission
 * @param currentCount The number of existing students in this sequence context
 * @returns Formatted Roll Number string
 */
export function generateRollNumber(gradeHex: string, admissionDate: Date, currentCount: number): string {
    // 1. YY: Last 2 digits of admission year
    const year = admissionDate.getFullYear().toString().slice(-2);

    // 2. Sequence: currentCount + 1, padded to 3 digits
    const sequence = (currentCount + 1).toString().padStart(3, '0');

    // 3. Grade: Hex code (ensure it's uppercase)
    const grade = gradeHex.toUpperCase();

    return `${year}${sequence}${grade}`;
}
