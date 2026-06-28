import { PrismaClient } from '@prisma/client';
import 'dotenv/config';
import { hash } from 'bcryptjs';
import { ROLE_TEMPLATES } from '../src/lib/role-templates';

const prisma = new PrismaClient();

async function seedRoles(schoolId: string) {
    let ownerRole: any = null;
    let accountantRole: any = null;
    let teacherRole: any = null;
    for (const t of ROLE_TEMPLATES) {
        const role = await prisma.role.upsert({
            where: { schoolId_name: { schoolId, name: t.name } },
            update: {},
            create: {
                schoolId,
                name: t.name,
                description: t.description,
                isSystem: true,
                isOwner: !!t.isOwner,
                permissions: t.permissions,
            },
        });
        if (t.isOwner) ownerRole = role;
        if (t.name === 'Accountant') accountantRole = role;
        if (t.name === 'Teacher') teacherRole = role;
    }
    return { ownerRole, accountantRole, teacherRole };
}

async function main() {
    const rawPassword = process.env.SEED_ADMIN_PASSWORD || `seed-${Math.random().toString(36).slice(2, 10)}`;
    if (!process.env.SEED_ADMIN_PASSWORD) {
        console.warn(`SEED_ADMIN_PASSWORD not set — using generated password: ${rawPassword}`);
    }
    const password = await hash(rawPassword, 12);
    const teacherPassword = await hash('Teacher@1234', 12);

    // ─── 1. SuperAdmin ────────────────────────────────────────────────────────
    const superAdmin = await prisma.superAdmin.upsert({
        where: { username: 'admin' },
        update: { password },
        create: { username: 'admin', password, email: 'admin@school.com' },
    });
    console.log('✓ SuperAdmin:', superAdmin.username);

    // ─── 2. Demo school ───────────────────────────────────────────────────────
    const school = await prisma.school.upsert({
        where: { slug: 'route-school-karyala' },
        update: {},
        create: {
            name: 'Route School Karyala',
            slug: 'route-school-karyala',
            address: 'Main Bazar, Karyala, Attock, Punjab',
            phone: '0572-123456',
            email: 'info@routeschool.edu.pk',
            superAdminId: superAdmin.id,
        },
    });
    console.log('✓ School:', school.name);

    // ─── 3. Roles ─────────────────────────────────────────────────────────────
    const { ownerRole, accountantRole, teacherRole } = await seedRoles(school.id);
    console.log('✓ Roles seeded:', ROLE_TEMPLATES.map((t) => t.name).join(', '));

    // ─── 4. Admin accounts ────────────────────────────────────────────────────
    await prisma.user.upsert({
        where: { username_schoolId: { username: 'admin_route', schoolId: school.id } },
        update: { password, roleId: ownerRole?.id ?? null },
        create: {
            username: 'admin_route',
            password,
            role: 'SchoolAdmin',
            roleId: ownerRole?.id ?? null,
            schoolId: school.id,
            isActive: true,
        },
    });
    await prisma.user.upsert({
        where: { username_schoolId: { username: 'clerk_route', schoolId: school.id } },
        update: { password, roleId: accountantRole?.id ?? null },
        create: {
            username: 'clerk_route',
            password,
            role: 'Finance',
            roleId: accountantRole?.id ?? null,
            schoolId: school.id,
            isActive: true,
        },
    });
    console.log('✓ Admin accounts: admin_route, clerk_route');

    // ─── 5. Bank account ──────────────────────────────────────────────────────
    const existingBank = await prisma.bankAccount.findFirst({ where: { schoolId: school.id } });
    if (!existingBank) {
        await prisma.bankAccount.create({
            data: {
                schoolId: school.id,
                bankName: 'Meezan Bank',
                accountTitle: 'Route School Karyala',
                accountNumber: '01230107123456789',
                isDefault: true,
            },
        });
    }
    console.log('✓ Bank account seeded');

    // ─── 6. Classes ───────────────────────────────────────────────────────────
    const classData = [
        { name: 'Nursery',  gradeLevel: 0, hexCode: 'NR', section: 'Blue', fee: 1500 },
        { name: 'Prep',     gradeLevel: 0, hexCode: 'PR', section: 'Red',  fee: 1800 },
        { name: 'Grade 1',  gradeLevel: 1, hexCode: '01', section: 'A',    fee: 2200 },
        { name: 'Grade 2',  gradeLevel: 2, hexCode: '02', section: 'A',    fee: 2200 },
        { name: 'Grade 3',  gradeLevel: 3, hexCode: '03', section: 'A',    fee: 2500 },
        { name: 'Grade 4',  gradeLevel: 4, hexCode: '04', section: 'A',    fee: 2500 },
        { name: 'Grade 5',  gradeLevel: 5, hexCode: '05', section: 'A',    fee: 2800 },
        { name: 'Grade 6',  gradeLevel: 6, hexCode: '06', section: 'A',    fee: 3000 },
        { name: 'Grade 7',  gradeLevel: 7, hexCode: '07', section: 'A',    fee: 3000 },
        { name: 'Grade 8',  gradeLevel: 8, hexCode: '08', section: 'A',    fee: 3200 },
    ];

    const classMap: Record<string, any> = {};
    for (const c of classData) {
        const cls = await prisma.class.upsert({
            where: { name_section_schoolId: { name: c.name, section: c.section, schoolId: school.id } },
            update: {},
            create: {
                schoolId: school.id,
                name: c.name,
                gradeLevel: c.gradeLevel,
                hexCode: c.hexCode,
                section: c.section,
                monthlyTuitionFee: c.fee,
            },
        });
        classMap[c.name] = cls;
    }
    console.log('✓ Classes seeded:', classData.map((c) => c.name).join(', '));

    // ─── 7. Teachers ──────────────────────────────────────────────────────────
    const teacherData = [
        {
            firstName: 'Muhammad Usman', lastName: 'Akhtar', gender: 'Male',
            cnic: '3740215678901', email: 'usman.akhtar@routeschool.edu.pk',
            phone: '03335678901', qualification: 'M.Sc Mathematics',
            subject: 'Mathematics', experience: '8 Years',
            joiningDate: new Date('2017-03-15'), salary: 35000,
            address: 'House 12, Street 4, Karyala, Attock',
            username: 'usman.akhtar',
        },
        {
            firstName: 'Ayesha', lastName: 'Siddiqui', gender: 'Female',
            cnic: '3740298765432', email: 'ayesha.siddiqui@routeschool.edu.pk',
            phone: '03214567890', qualification: 'M.A English Literature',
            subject: 'English', experience: '5 Years',
            joiningDate: new Date('2020-01-10'), salary: 28000,
            address: 'House 7, Mohalla Hussainabad, Karyala',
            username: 'ayesha.siddiqui',
        },
        {
            firstName: 'Tariq', lastName: 'Mehmood', gender: 'Male',
            cnic: '3740256781234', email: 'tariq.mehmood@routeschool.edu.pk',
            phone: '03009876543', qualification: 'B.Sc Biology, Chemistry',
            subject: 'Science', experience: '12 Years',
            joiningDate: new Date('2013-08-01'), salary: 42000,
            address: 'Main Bazar, Karyala, Attock',
            username: 'tariq.mehmood',
        },
        {
            firstName: 'Sana', lastName: 'Rashid', gender: 'Female',
            cnic: '3740287654321', email: 'sana.rashid@routeschool.edu.pk',
            phone: '03121234567', qualification: 'B.Ed, M.A Urdu',
            subject: 'Urdu', experience: '3 Years',
            joiningDate: new Date('2022-04-05'), salary: 22000,
            address: 'House 33, Gulshan Colony, Hazro',
            username: 'sana.rashid',
        },
        {
            firstName: 'Abdul Rehman', lastName: 'Butt', gender: 'Male',
            cnic: '3520165432109', email: 'abdulrehman.butt@routeschool.edu.pk',
            phone: '03451234567', qualification: 'M.A Islamic Studies',
            subject: 'Islamiyat', experience: '15 Years',
            joiningDate: new Date('2010-02-20'), salary: 38000,
            address: 'Near Jamia Masjid, Karyala',
            username: 'abdulrehman.butt',
        },
    ];

    const teacherMap: Record<string, any> = {};
    for (const t of teacherData) {
        const teacher = await prisma.teacher.upsert({
            where: { email_schoolId: { email: t.email, schoolId: school.id } },
            update: {},
            create: {
                schoolId: school.id,
                firstName: t.firstName,
                lastName: t.lastName,
                gender: t.gender,
                cnic: t.cnic,
                email: t.email,
                phone: t.phone,
                qualification: t.qualification,
                subject: t.subject,
                experience: t.experience,
                joiningDate: t.joiningDate,
                salary: t.salary,
                address: t.address,
            },
        });
        teacherMap[t.username] = teacher;
    }
    console.log('✓ Teachers seeded:', teacherData.map((t) => `${t.firstName} ${t.lastName}`).join(', '));

    // ─── 8. Teacher login accounts ────────────────────────────────────────────
    const teacherAccounts = [
        { username: 'usman.akhtar',      teacher: teacherMap['usman.akhtar'] },
        { username: 'ayesha.siddiqui',   teacher: teacherMap['ayesha.siddiqui'] },
        { username: 'tariq.mehmood',     teacher: teacherMap['tariq.mehmood'] },
        { username: 'sana.rashid',       teacher: teacherMap['sana.rashid'] },
        { username: 'abdulrehman.butt',  teacher: teacherMap['abdulrehman.butt'] },
    ];
    for (const ta of teacherAccounts) {
        await prisma.user.upsert({
            where: { username_schoolId: { username: ta.username, schoolId: school.id } },
            update: {},
            create: {
                username: ta.username,
                password: teacherPassword,
                role: 'Teacher',
                roleId: teacherRole?.id ?? null,
                schoolId: school.id,
                teacherId: ta.teacher.id,
                isActive: true,
            },
        });
    }
    console.log('✓ Teacher login accounts seeded (password: Teacher@1234)');

    // ─── 9. Teacher → Class assignments ──────────────────────────────────────
    const assignmentData = [
        // Usman Akhtar — Mathematics (class teacher of Grade 6)
        { teacher: 'usman.akhtar',     class: 'Grade 5', subject: 'Mathematics', isClassTeacher: false },
        { teacher: 'usman.akhtar',     class: 'Grade 6', subject: 'Mathematics', isClassTeacher: true  },
        { teacher: 'usman.akhtar',     class: 'Grade 7', subject: 'Mathematics', isClassTeacher: false },
        { teacher: 'usman.akhtar',     class: 'Grade 8', subject: 'Mathematics', isClassTeacher: false },
        // Ayesha Siddiqui — English (class teacher of Grade 3)
        { teacher: 'ayesha.siddiqui',  class: 'Grade 3', subject: 'English',     isClassTeacher: true  },
        { teacher: 'ayesha.siddiqui',  class: 'Grade 4', subject: 'English',     isClassTeacher: false },
        { teacher: 'ayesha.siddiqui',  class: 'Grade 5', subject: 'English',     isClassTeacher: false },
        { teacher: 'ayesha.siddiqui',  class: 'Grade 6', subject: 'English',     isClassTeacher: false },
        // Tariq Mehmood — Science (class teacher of Grade 8)
        { teacher: 'tariq.mehmood',    class: 'Grade 5', subject: 'Science',     isClassTeacher: false },
        { teacher: 'tariq.mehmood',    class: 'Grade 6', subject: 'Science',     isClassTeacher: false },
        { teacher: 'tariq.mehmood',    class: 'Grade 7', subject: 'Science',     isClassTeacher: false },
        { teacher: 'tariq.mehmood',    class: 'Grade 8', subject: 'Science',     isClassTeacher: true  },
        // Sana Rashid — Urdu (class teacher of Grade 1)
        { teacher: 'sana.rashid',      class: 'Nursery', subject: 'Urdu',        isClassTeacher: true  },
        { teacher: 'sana.rashid',      class: 'Prep',    subject: 'Urdu',        isClassTeacher: true  },
        { teacher: 'sana.rashid',      class: 'Grade 1', subject: 'Urdu',        isClassTeacher: true  },
        { teacher: 'sana.rashid',      class: 'Grade 2', subject: 'Urdu',        isClassTeacher: false },
        { teacher: 'sana.rashid',      class: 'Grade 3', subject: 'Urdu',        isClassTeacher: false },
        // Abdul Rehman Butt — Islamiyat
        { teacher: 'abdulrehman.butt', class: 'Grade 1', subject: 'Islamiyat',   isClassTeacher: false },
        { teacher: 'abdulrehman.butt', class: 'Grade 2', subject: 'Islamiyat',   isClassTeacher: true  },
        { teacher: 'abdulrehman.butt', class: 'Grade 3', subject: 'Islamiyat',   isClassTeacher: false },
        { teacher: 'abdulrehman.butt', class: 'Grade 4', subject: 'Islamiyat',   isClassTeacher: true  },
        { teacher: 'abdulrehman.butt', class: 'Grade 5', subject: 'Islamiyat',   isClassTeacher: false },
        { teacher: 'abdulrehman.butt', class: 'Grade 6', subject: 'Islamiyat',   isClassTeacher: false },
        { teacher: 'abdulrehman.butt', class: 'Grade 7', subject: 'Islamiyat',   isClassTeacher: true  },
        { teacher: 'abdulrehman.butt', class: 'Grade 8', subject: 'Islamiyat',   isClassTeacher: false },
    ];

    for (const a of assignmentData) {
        const teacher = teacherMap[a.teacher];
        const cls = classMap[a.class];
        if (!teacher || !cls) continue;
        await prisma.teacherClassAssignment.upsert({
            where: { teacherId_classId_subject: { teacherId: teacher.id, classId: cls.id, subject: a.subject } },
            update: { isClassTeacher: a.isClassTeacher },
            create: { teacherId: teacher.id, classId: cls.id, subject: a.subject, isClassTeacher: a.isClassTeacher },
        });
    }
    console.log('✓ Teacher–class assignments seeded');

    // ─── 10. Guardians & Students ─────────────────────────────────────────────
    const guardianStudentData = [
        {
            guardian: {
                name: 'Khalid Mehmood', relation: 'Father', cnic: '3740256781299',
                dateOfBirth: new Date('1978-05-14'), contact: '03005678912',
                address: 'House 9, Street 2, Karyala, Attock',
            },
            students: [{
                name: 'Hassan Khalid', gender: 'Male' as const,
                dateOfBirth: new Date('2015-03-12'), bFormNumber: '37402-5678129-9',
                dateOfAdmission: new Date('2024-04-01'), className: 'Grade 3',
                rollNumber: '2403001', monthlyFees: 2500, discount: 0,
            }],
        },
        {
            guardian: {
                name: 'Rizwan Ahmed', relation: 'Father', cnic: '3740298123456',
                dateOfBirth: new Date('1981-09-22'), contact: '03331234567',
                address: 'Mohalla Islamabad, Karyala',
            },
            students: [{
                name: 'Fatima Rizwan', gender: 'Female' as const,
                dateOfBirth: new Date('2016-07-22'), bFormNumber: '37402-9812345-6',
                dateOfAdmission: new Date('2024-04-01'), className: 'Grade 2',
                rollNumber: '2402001', monthlyFees: 2200, discount: 10,
            }],
        },
        {
            guardian: {
                name: 'Imran Khan', relation: 'Father', cnic: '3740265432198',
                dateOfBirth: new Date('1976-11-30'), contact: '03214321098',
                address: 'House 5, Near Masjid, Karyala',
            },
            students: [
                {
                    name: 'Ali Imran', gender: 'Male' as const,
                    dateOfBirth: new Date('2014-11-05'), bFormNumber: '37402-6543219-8',
                    dateOfAdmission: new Date('2023-04-01'), className: 'Grade 4',
                    rollNumber: '2304001', monthlyFees: 2500, discount: 0,
                },
            ],
        },
        {
            guardian: {
                name: 'Nadia Bibi', relation: 'Mother', cnic: '3520187654320',
                dateOfBirth: new Date('1983-03-17'), contact: '03456789012',
                address: 'Village Dheri Khurd, Hazro',
            },
            students: [{
                name: 'Zainab Nadia', gender: 'Female' as const,
                dateOfBirth: new Date('2017-01-30'), bFormNumber: '35201-8765432-0',
                dateOfAdmission: new Date('2024-04-01'), className: 'Grade 1',
                rollNumber: '2401001', monthlyFees: 2200, discount: 20,
            }],
        },
        {
            guardian: {
                name: 'Sajid Hussain', relation: 'Father', cnic: '3740212345678',
                dateOfBirth: new Date('1974-08-10'), contact: '03009871234',
                address: 'Main Road, Karyala, Attock',
            },
            students: [{
                name: 'Umar Sajid', gender: 'Male' as const,
                dateOfBirth: new Date('2013-08-15'), bFormNumber: '37402-1234567-8',
                dateOfAdmission: new Date('2022-04-01'), className: 'Grade 5',
                rollNumber: '2205001', monthlyFees: 2800, discount: 0,
            }],
        },
        {
            guardian: {
                name: 'Amjad Ali', relation: 'Father', cnic: '3740276543210',
                dateOfBirth: new Date('1979-06-25'), contact: '03121876543',
                address: 'House 21, Mohalla Gulzar, Karyala',
            },
            students: [{
                name: 'Hira Amjad', gender: 'Female' as const,
                dateOfBirth: new Date('2018-05-20'), bFormNumber: '37402-7654321-0',
                dateOfAdmission: new Date('2024-04-01'), className: 'Prep',
                rollNumber: '24PR001', monthlyFees: 1800, discount: 0,
            }],
        },
        {
            guardian: {
                name: 'Farhan Iqbal', relation: 'Father', cnic: '3740289012345',
                dateOfBirth: new Date('1980-12-07'), contact: '03451876543',
                address: 'House 44, Street 6, Karyala',
            },
            students: [{
                name: 'Ibrahim Farhan', gender: 'Male' as const,
                dateOfBirth: new Date('2014-03-09'), bFormNumber: '37402-8901234-5',
                dateOfAdmission: new Date('2023-04-01'), className: 'Grade 4',
                rollNumber: '2304002', monthlyFees: 2500, discount: 15,
            }],
        },
        {
            guardian: {
                name: 'Shazia Khanam', relation: 'Mother', cnic: '3740243219870',
                dateOfBirth: new Date('1985-02-19'), contact: '03334567890',
                address: 'House 3, Mohalla Noor, Karyala',
            },
            students: [{
                name: 'Maryam Shazia', gender: 'Female' as const,
                dateOfBirth: new Date('2016-12-14'), bFormNumber: '37402-4321987-0',
                dateOfAdmission: new Date('2024-04-01'), className: 'Grade 2',
                rollNumber: '2402002', monthlyFees: 2200, discount: 0,
            }],
        },
    ];

    for (const { guardian: gData, students } of guardianStudentData) {
        const guardian = await prisma.guardian.upsert({
            where: { cnic_schoolId: { cnic: gData.cnic, schoolId: school.id } },
            update: {},
            create: {
                schoolId: school.id,
                name: gData.name,
                relation: gData.relation,
                cnic: gData.cnic,
                dateOfBirth: gData.dateOfBirth,
                contact: gData.contact,
                address: gData.address,
            },
        });

        for (const s of students) {
            const cls = classMap[s.className];
            if (!cls) { console.warn(`Class not found: ${s.className}`); continue; }
            const finalFee = s.monthlyFees * (1 - s.discount / 100);
            await prisma.student.upsert({
                where: { rollNumber_schoolId: { rollNumber: s.rollNumber, schoolId: school.id } },
                update: {},
                create: {
                    schoolId: school.id,
                    name: s.name,
                    rollNumber: s.rollNumber,
                    gender: s.gender,
                    dateOfBirth: s.dateOfBirth,
                    dateOfAdmission: s.dateOfAdmission,
                    bFormNumber: s.bFormNumber,
                    classId: cls.id,
                    guardianId: guardian.id,
                    monthlyFees: s.monthlyFees,
                    discountPercentage: s.discount,
                    finalFee,
                },
            });
        }
    }
    console.log('✓ Guardians & students seeded (8 students across 8 families)');

    // ─── 11. Staff ────────────────────────────────────────────────────────────
    const staffData = [
        {
            name: 'Bashir Ahmad', fatherName: 'Ghulam Ahmad', cnic: '3740234567890',
            dateOfBirth: new Date('1985-06-10'), contact: '03125678901',
            gender: 'Male' as const, role: 'Peon', workingHours: '8:00 AM – 4:00 PM',
        },
        {
            name: 'Zulfiqar Ali', fatherName: 'Fida Hussain', cnic: '3740278901234',
            dateOfBirth: new Date('1980-11-25'), contact: '03009012345',
            gender: 'Male' as const, role: 'Security Guard', workingHours: '6:00 AM – 2:00 PM',
        },
        {
            name: 'Rubina Parveen', fatherName: 'Muhammad Yousaf', cnic: '3520156781230',
            dateOfBirth: new Date('1990-03-17'), contact: '03338901234',
            gender: 'Female' as const, role: 'Librarian', workingHours: '8:00 AM – 3:00 PM',
        },
    ];

    for (const s of staffData) {
        await prisma.staff.upsert({
            where: { cnic_schoolId: { cnic: s.cnic, schoolId: school.id } },
            update: {},
            create: { schoolId: school.id, ...s },
        });
    }
    console.log('✓ Staff seeded: Bashir (Peon), Zulfiqar (Security), Rubina (Librarian)');

    // ─── 12. Income records ───────────────────────────────────────────────────
    const incomeData = [
        {
            transactionId: 'seed-income-01',
            date: new Date('2026-06-01'), category: 'Fee' as const,
            source: 'Student Fee Collection — June 2026',
            amount: 45000, paymentMethod: 'Cash',
            description: 'Monthly tuition fee collection for June 2026',
        },
        {
            transactionId: 'seed-income-02',
            date: new Date('2026-06-05'), category: 'Fee' as const,
            source: 'New Admissions — April 2026',
            amount: 15000, paymentMethod: 'Bank Transfer',
            description: 'Admission fee from 3 new students',
        },
        {
            transactionId: 'seed-income-03',
            date: new Date('2026-06-10'), category: 'Fee' as const,
            source: 'Student Fee Collection — June (late payments)',
            amount: 8500, paymentMethod: 'Cash',
            description: 'Late fee payments June 2026',
        },
        {
            transactionId: 'seed-income-04',
            date: new Date('2026-05-02'), category: 'Fee' as const,
            source: 'Student Fee Collection — May 2026',
            amount: 47500, paymentMethod: 'Cash',
            description: 'Monthly tuition fee collection for May 2026',
        },
        {
            transactionId: 'seed-income-05',
            date: new Date('2026-04-03'), category: 'Fee' as const,
            source: 'Student Fee Collection — April 2026',
            amount: 43000, paymentMethod: 'Cash',
            description: 'Monthly tuition fee collection for April 2026',
        },
        {
            transactionId: 'seed-income-06',
            date: new Date('2026-04-01'), category: 'ExtraCharge' as const,
            source: 'Annual Exam Fee — 2026',
            amount: 12000, paymentMethod: 'Cash',
            description: 'Annual examination fee collected from all students',
        },
    ];

    for (const inc of incomeData) {
        await prisma.incomeRecord.upsert({
            where: { schoolId_transactionId: { schoolId: school.id, transactionId: inc.transactionId } },
            update: {},
            create: { schoolId: school.id, ...inc, status: 'Paid' },
        });
    }
    console.log('✓ Income records seeded (6 entries)');

    // ─── 13. Expense records ──────────────────────────────────────────────────
    const expenseData = [
        {
            transactionId: 'seed-expense-01',
            date: new Date('2026-06-02'), category: 'Utilities' as const,
            description: 'Electricity bill for May 2026',
            amount: 12000, paidTo: 'WAPDA', paymentMethod: 'Bank Transfer',
        },
        {
            transactionId: 'seed-expense-02',
            date: new Date('2026-06-05'), category: 'Maintenance' as const,
            description: 'Repair of classroom windows and whiteboard',
            amount: 3500, paidTo: 'Usman Hardware Store', paymentMethod: 'Cash',
        },
        {
            transactionId: 'seed-expense-03',
            date: new Date('2026-06-10'), category: 'Salary' as const,
            description: 'Advance salary — 2 junior teachers June 2026',
            amount: 25000, paidTo: 'Teaching Staff', paymentMethod: 'Bank Transfer',
        },
        {
            transactionId: 'seed-expense-04',
            date: new Date('2026-06-15'), category: 'Supplies' as const,
            description: 'Stationery and craft supplies for art class',
            amount: 7200, paidTo: 'Al-Madina Stationery', paymentMethod: 'Cash',
        },
        {
            transactionId: 'seed-expense-05',
            date: new Date('2026-05-01'), category: 'Utilities' as const,
            description: 'Electricity bill for April 2026',
            amount: 10500, paidTo: 'WAPDA', paymentMethod: 'Bank Transfer',
        },
        {
            transactionId: 'seed-expense-06',
            date: new Date('2026-05-31'), category: 'Salary' as const,
            description: 'Staff salaries for May 2026',
            amount: 165000, paidTo: 'All Staff', paymentMethod: 'Bank Transfer',
        },
        {
            transactionId: 'seed-expense-07',
            date: new Date('2026-04-30'), category: 'Salary' as const,
            description: 'Staff salaries for April 2026',
            amount: 165000, paidTo: 'All Staff', paymentMethod: 'Bank Transfer',
        },
        {
            transactionId: 'seed-expense-08',
            date: new Date('2026-04-10'), category: 'Supplies' as const,
            description: 'New textbooks and workbooks for Grade 1–5',
            amount: 18500, paidTo: 'Ilm Publishers Rawalpindi', paymentMethod: 'Bank Transfer',
        },
    ];

    for (const exp of expenseData) {
        await prisma.expenseRecord.upsert({
            where: { schoolId_transactionId: { schoolId: school.id, transactionId: exp.transactionId } },
            update: {},
            create: { schoolId: school.id, ...exp },
        });
    }
    console.log('✓ Expense records seeded (8 entries)');

    // ─── Done ─────────────────────────────────────────────────────────────────
    console.log('\n🎉 Seed complete! Demo school is fully loaded.\n');
    console.log('  Login at http://localhost:3000/login\n');
    console.log('  SUPER ADMIN   →  username: admin           password:', rawPassword, '  (no school slug)');
    console.log('  SCHOOL ADMIN  →  username: admin_route     password:', rawPassword, '  slug: route-school-karyala');
    console.log('  ACCOUNTANT    →  username: clerk_route     password:', rawPassword, '  slug: route-school-karyala');
    console.log('  TEACHERS      →  username: usman.akhtar / ayesha.siddiqui / tariq.mehmood / sana.rashid / abdulrehman.butt');
    console.log('                   password: Teacher@1234    slug: route-school-karyala\n');
}

main()
    .then(async () => { await prisma.$disconnect(); })
    .catch(async (e) => {
        console.error('Seed error:', e.message || e);
        await prisma.$disconnect();
        process.exit(1);
    });
