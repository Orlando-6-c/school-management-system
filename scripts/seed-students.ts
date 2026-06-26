import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const db = new PrismaClient();

const PAKISTANI_FIRST_NAMES_MALE = ['Ali', 'Ahmed', 'Bilal', 'Hamza', 'Usman', 'Tariq', 'Zain', 'Rehman', 'Omar', 'Kamran', 'Faisal', 'Imran', 'Saad'];
const PAKISTANI_FIRST_NAMES_FEMALE = ['Ayesha', 'Fatima', 'Zainab', 'Iqra', 'Mehwish', 'Sana', 'Hina', 'Maryam', 'Rabia', 'Khadija', 'Sadia', 'Nida'];
const PAKISTANI_LAST_NAMES = ['Khan', 'Ahmed', 'Ali', 'Qureshi', 'Chaudhry', 'Sheikh', 'Malik', 'Raza', 'Shah', 'Abbas', 'Hussain', 'Iqbal'];
const ADDRESSES = ['Clifton, Karachi', 'DHA, Lahore', 'F-8, Islamabad', 'Gulshan-e-Iqbal, Karachi', 'Bahria Town, Rawalpindi', 'Johar Town, Lahore', 'Saddar, Rawalpindi', 'Model Town, Lahore', 'Gulberg, Lahore', 'Satellite Town, Gujranwala', 'Cantt, Peshawar', 'Qasimabad, Hyderabad', 'Latifabad, Hyderabad', 'F-11, Islamabad', 'G-10, Islamabad'];

function randomElement<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateName(gender: 'Male' | 'Female'): string {
    const first = gender === 'Male' ? randomElement(PAKISTANI_FIRST_NAMES_MALE) : randomElement(PAKISTANI_FIRST_NAMES_FEMALE);
    const last = randomElement(PAKISTANI_LAST_NAMES);
    return `${first} ${last}`;
}

function generateCNIC(): string {
    return `${Math.floor(10000 + Math.random() * 90000)}-${Math.floor(1000000 + Math.random() * 9000000)}-${Math.floor(1 + Math.random() * 9)}`;
}

function generatePhone(): string {
    return `03${Math.floor(10 + Math.random() * 30)}${Math.floor(1000000 + Math.random() * 9000000)}`;
}

async function main() {
    const school = await db.school.findFirst({
        where: { name: { contains: 'Route School' } }
    });

    if (!school) {
        throw new Error('School not found.');
    }

    const classes = await db.class.findMany({
        where: { schoolId: school.id }
    });

    if (classes.length === 0) {
        throw new Error('No classes found in school. Run seed-classes first.');
    }

    console.log(`Generating 35 Guardians and 50 Students for ${school.name}...`);

    // 1. Generate 35 Guardians
    const guardiansData = [];
    for (let i = 0; i < 35; i++) {
        const cnic = generateCNIC();
        const phone = generatePhone();
        const gender = Math.random() > 0.5 ? 'Male' : 'Female';
        const hashedPassword = await bcrypt.hash(phone, 10);

        guardiansData.push({
            name: generateName(gender),
            relation: gender === 'Male' ? 'Father' : 'Mother',
            cnic,
            phone,
            hashedPassword,
            dateOfBirth: new Date(1975 + Math.floor(Math.random() * 15), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28)),
            contact: phone,
            address: randomElement(ADDRESSES),
            email: `parent${Math.floor(Math.random() * 99999)}@gmail.com`
        });
    }

    const createdGuardians = [];
    for (const gData of guardiansData) {
        const guardian = await db.$transaction(async (tx) => {
            const newGuardian = await tx.guardian.create({
                data: {
                    name: gData.name,
                    relation: gData.relation,
                    cnic: gData.cnic,
                    dateOfBirth: gData.dateOfBirth,
                    contact: gData.contact,
                    address: gData.address,
                    email: gData.email,
                    schoolId: school.id
                }
            });

            const user = await tx.user.create({
                data: {
                    username: gData.cnic,
                    password: gData.hashedPassword,
                    role: 'Parent',
                    schoolId: school.id,
                    guardianId: newGuardian.id
                }
            });

            return newGuardian;
        });
        createdGuardians.push(guardian);
    }
    console.log(`Successfully created ${createdGuardians.length} Guardians and their User accounts.`);

    // 2. Generate 50 Students
    for (let i = 0; i < 50; i++) {
        const gender = Math.random() > 0.5 ? 'Male' : 'Female';
        const name = generateName(gender);

        // Randomly pick a class
        const assignedClass = randomElement(classes);
        // Randomly pick a guardian to ensure 15 students act as siblings sharing parents
        const assignedGuardian = randomElement(createdGuardians);

        // Roll number format (YY + Sequence + GradeHex)
        const sequence = String(i + 1).padStart(3, '0');
        const rollNumber = `26${sequence}${assignedClass.hexCode}`;
        const hashedPassword = await bcrypt.hash(rollNumber, 10);

        // Discounts
        let discountPercentage = 0;
        const discountRoll = Math.random();
        if (discountRoll > 0.8) discountPercentage = 50; // 20% of kids get 50% off
        else if (discountRoll > 0.6) discountPercentage = 10; // 20% of kids get 10% off

        const monthlyFees = Number(assignedClass.monthlyTuitionFee);
        const finalFee = monthlyFees * (1 - discountPercentage / 100);

        await db.$transaction(async (tx) => {
            const student = await tx.student.create({
                data: {
                    name,
                    rollNumber,
                    dateOfBirth: new Date(2010 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28)),
                    dateOfAdmission: new Date(),
                    bFormNumber: generateCNIC(),
                    gender: gender,
                    monthlyFees: monthlyFees,
                    discountPercentage: discountPercentage,
                    finalFee: finalFee,
                    schoolId: school.id,
                    classId: assignedClass.id,
                    guardianId: assignedGuardian.id,
                }
            });

            await tx.user.create({
                data: {
                    username: rollNumber,
                    password: hashedPassword,
                    role: 'Student',
                    schoolId: school.id,
                    studentId: student.id
                }
            });
        });

        console.log(`Created Student: ${name} | Roll: ${rollNumber} | Guardian: ${assignedGuardian.name} | Fee: ${finalFee} (Discount: ${discountPercentage}%)`);
    }

    console.log(`System perfectly populated with 50 diverse mocked Students & Parents linked to Route School Karyala.`);
}

main().catch(console.error).finally(() => db.$disconnect());
