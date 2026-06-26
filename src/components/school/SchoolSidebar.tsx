'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout } from '@/actions/auth';
import {
    LayoutDashboard,
    Users,
    BookOpen,
    Settings,
    LogOut,
    GraduationCap,
    School,
    DollarSign,
    Calendar,
    ShieldCheck,
    ClipboardList,
    BarChart3,
    UserCog,
    Briefcase,
    ScrollText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export interface NavVisibility {
    students: boolean;
    teachers: boolean;
    parents: boolean;
    staff: boolean;
    academics: boolean;
    attendance: boolean;
    finance: boolean;
    reports: boolean;
    users: boolean;
    settings: boolean;
}

interface SchoolSidebarProps {
    schoolName: string;
    schoolSlug: string;
    userName: string;
    userRole: string;
    nav: NavVisibility;
}

export function SchoolSidebar({ schoolName, userName, userRole, nav }: SchoolSidebarProps) {
    const pathname = usePathname();

    const isActive = (path: string) =>
        pathname === path || (path !== '/school' && pathname?.startsWith(`${path}/`));

    const links = [
        { href: '/school', label: 'Dashboard', icon: LayoutDashboard, show: true },
        { href: '/school/students', label: 'Students', icon: GraduationCap, show: nav.students },
        { href: '/school/teachers', label: 'Teachers', icon: Users, show: nav.teachers },
        { href: '/school/staff', label: 'Staff', icon: Briefcase, show: nav.staff },
        { href: '/school/parents', label: 'Parents', icon: Users, show: nav.parents },
        { href: '/school/classes', label: 'Classes', icon: BookOpen, show: nav.academics || nav.students },
        { href: '/school/academics', label: 'Academics', icon: BookOpen, show: nav.academics },
        { href: '/school/academics/timetable', label: 'Timetables', icon: Calendar, show: nav.academics },
        { href: '/school/attendance', label: 'Attendance', icon: ClipboardList, show: nav.attendance },
        { href: '/school/finance', label: 'Finance', icon: DollarSign, show: nav.finance },
        { href: '/school/reports', label: 'Reports', icon: BarChart3, show: nav.reports },
        { href: '/school/users', label: 'Users & Roles', icon: ShieldCheck, show: nav.users },
        { href: '/school/settings', label: 'Settings', icon: Settings, show: nav.settings },
        { href: '/school/settings/audit-log', label: 'Audit Log', icon: ScrollText, show: nav.settings },
    ];

    const visibleLinks = links.filter((l) => l.show);

    // Get initials for avatar
    const initials = userName
        .split(/[\s_-]/)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? '')
        .join('');

    return (
        <aside
            className="w-64 flex flex-col fixed h-full z-10 border-r"
            style={{
                backgroundColor: 'var(--sidebar)',
                borderColor: 'var(--sidebar-border)',
            }}
        >
            {/* Logo / School name */}
            <div
                className="flex items-center gap-3 px-5 h-16 border-b shrink-0"
                style={{ borderColor: 'var(--sidebar-border)' }}
            >
                <div
                    className="flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: 'var(--sidebar-primary)', color: 'var(--sidebar-primary-foreground)' }}
                >
                    <School size={16} />
                </div>
                <div className="flex flex-col min-w-0">
                    <span
                        className="text-sm font-bold leading-tight truncate"
                        style={{ color: 'var(--sidebar-foreground)' }}
                        title={schoolName}
                    >
                        {schoolName}
                    </span>
                    <span className="text-[10px] font-medium uppercase tracking-widest" style={{ color: 'var(--sidebar-foreground)', opacity: 0.4 }}>
                        {userRole || 'Staff'}
                    </span>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
                <p
                    className="px-3 pt-1 pb-2 text-[10px] font-semibold uppercase tracking-widest"
                    style={{ color: 'var(--sidebar-foreground)', opacity: 0.35 }}
                >
                    Menu
                </p>
                {visibleLinks.map((link) => {
                    const active = isActive(link.href);
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                                active
                                    ? 'shadow-sm'
                                    : 'opacity-75 hover:opacity-100'
                            )}
                            style={
                                active
                                    ? {
                                          backgroundColor: 'var(--sidebar-primary)',
                                          color: 'var(--sidebar-primary-foreground)',
                                      }
                                    : {
                                          color: 'var(--sidebar-foreground)',
                                      }
                            }
                            onMouseEnter={(e) => {
                                if (!active) {
                                    (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--sidebar-accent)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!active) {
                                    (e.currentTarget as HTMLElement).style.backgroundColor = '';
                                }
                            }}
                        >
                            <link.icon size={16} className="shrink-0" />
                            <span>{link.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div
                className="px-3 py-4 border-t space-y-1 shrink-0"
                style={{ borderColor: 'var(--sidebar-border)' }}
            >
                {/* User info row */}
                <div className="flex items-center gap-2 px-3 py-2">
                    <div
                        className="flex-shrink-0 h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-bold"
                        style={{
                            backgroundColor: 'var(--sidebar-accent)',
                            color: 'var(--sidebar-foreground)',
                        }}
                    >
                        {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p
                            className="text-xs font-semibold truncate"
                            style={{ color: 'var(--sidebar-foreground)' }}
                        >
                            {userName}
                        </p>
                    </div>
                    <ThemeToggle />
                </div>

                {/* Account & Logout */}
                <Link
                    href="/school/settings/account"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium opacity-70 hover:opacity-100 transition-colors"
                    style={{ color: 'var(--sidebar-foreground)' }}
                    onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--sidebar-accent)';
                    }}
                    onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor = '';
                    }}
                >
                    <UserCog size={16} className="shrink-0" />
                    <span>Account</span>
                </Link>
                <form action={logout}>
                    <button
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full transition-colors"
                        style={{ color: 'oklch(0.65 0.2 25)', opacity: 0.8 }}
                        onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.opacity = '1';
                            (e.currentTarget as HTMLElement).style.backgroundColor = 'oklch(0.3 0.1 25 / 0.2)';
                        }}
                        onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.opacity = '0.8';
                            (e.currentTarget as HTMLElement).style.backgroundColor = '';
                        }}
                    >
                        <LogOut size={16} className="shrink-0" />
                        <span>Sign out</span>
                    </button>
                </form>
            </div>
        </aside>
    );
}
