import { redirect } from 'next/navigation';
import db from '@/lib/db';
import { getCurrentUserWithPermissions, userCan } from '@/lib/authz';
import { SchoolShell } from '@/components/school/SchoolShell';
import { getTrialDaysLeft } from '@/lib/plans';

export const runtime = 'nodejs';

export default async function SchoolLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const actor = await getCurrentUserWithPermissions();

    if (!actor) {
        redirect('/login');
    }

    if (actor.isSuperAdmin && !actor.schoolId) {
        redirect('/admin');
    }

    if (!actor.schoolId) {
        redirect('/login');
    }

    const school = await db.school.findUnique({
        where: { id: actor.schoolId },
        select: { name: true, slug: true, subscription: true },
    });
    if (!school) redirect('/login');

    const sub = school.subscription;
    const trialInfo = sub
        ? {
              plan: sub.plan,
              status: sub.status,
              daysLeft: sub.status === 'Trial' ? getTrialDaysLeft(sub.trialEndsAt) : 0,
          }
        : null;

    // Coarse guard here; fine-grained checks live in the server actions/pages.
    // Build the nav visibility map from resolved permissions.
    const nav = {
        students: userCan(actor, 'students', 'view'),
        teachers: userCan(actor, 'teachers', 'view'),
        parents: userCan(actor, 'parents', 'view'),
        staff: userCan(actor, 'staff', 'view'),
        academics: userCan(actor, 'academics', 'view'),
        attendance: userCan(actor, 'attendance', 'view'),
        finance:
            userCan(actor, 'fees', 'view') ||
            userCan(actor, 'payments', 'view') ||
            userCan(actor, 'expenses', 'view') ||
            userCan(actor, 'salaries', 'view'),
        reports: userCan(actor, 'reports', 'view'),
        users: userCan(actor, 'users', 'view'),
        settings: userCan(actor, 'settings', 'view'),
    };

    return (
        <SchoolShell
            schoolName={school.name}
            schoolSlug={school.slug}
            userName={actor.username}
            userRole={actor.role}
            nav={nav}
            trialInfo={trialInfo}
        >
            {children}
        </SchoolShell>
    );
}
