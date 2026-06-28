export const TRIAL_DAYS = 14;

export const PLANS = {
    Trial: {
        label: 'Free Trial',
        maxStudents: 50,
        maxUsers: 5,
        pricePerMonth: 0 as number | null,
        durationLabel: `${TRIAL_DAYS}-day trial`,
        features: [
            'Up to 50 students',
            'Up to 5 user accounts',
            'All features included',
            'Full support during trial',
        ],
    },
    Starter: {
        label: 'Starter',
        maxStudents: 200,
        maxUsers: 3,
        pricePerMonth: 2500 as number | null,
        durationLabel: '/month',
        features: [
            'Up to 200 students',
            'Up to 3 user accounts',
            'Students, teachers & staff',
            'Fee challans & payments',
            'Attendance marking',
            'Basic reports',
        ],
    },
    School: {
        label: 'School',
        maxStudents: 800,
        maxUsers: 10,
        pricePerMonth: 5500 as number | null,
        durationLabel: '/month',
        features: [
            'Up to 800 students',
            'Up to 10 user accounts',
            'Everything in Starter',
            'Academics & timetables',
            'Homework & study materials',
            'Custom roles & permissions',
            'Salary slips & expense tracking',
            'Audit log',
        ],
    },
    District: {
        label: 'District',
        maxStudents: Infinity,
        maxUsers: Infinity,
        pricePerMonth: null,
        durationLabel: 'custom',
        features: [
            'Unlimited students',
            'Unlimited user accounts',
            'Everything in School',
            'Priority support & SLA',
            'Onboarding & training',
            'Custom integrations',
            'White-label option',
        ],
    },
} as const;

export type PlanTier = keyof typeof PLANS;

export function getTrialDaysLeft(trialEndsAt: Date): number {
    return Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
}

export function isSubscriptionActive(status: string, trialEndsAt: Date | null): boolean {
    if (status === 'Trial') return !!trialEndsAt && trialEndsAt > new Date();
    return status === 'Active';
}

export function getPlanLimits(plan: PlanTier) {
    return { maxStudents: PLANS[plan].maxStudents, maxUsers: PLANS[plan].maxUsers };
}
