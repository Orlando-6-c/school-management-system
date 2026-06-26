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
        pathname === path || pathname?.startsWith(`${path}/`);

    // Each link is gated by a boolean derived from the user's resolved permissions.
    const links = [
        { href: '/school', label: 'Dashboard', icon: LayoutDashboard, show: true },
        { href: '/school/students', label: 'Students', icon: GraduationCap, show: nav.students },
        { href: '/school/teachers', label: 'Teachers', icon: Users, show: nav.teachers },
        { href: '/school/staff', label: 'Staff', icon: Briefcase, show: nav.staff },
        { href: '/school/parents', label: 'Parents', icon: Users, show: nav.parents },
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

    return (
        <aside className="w-64 bg-slate-900 text-white flex flex-col fixed h-full z-10 box-border">
            <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
                <div className="bg-primary p-2 rounded-lg">
                    <School className="h-6 w-6 text-white" />
                </div>
                <div>
                    <h2 className="text-sm font-bold text-white leading-tight" title={schoolName}>
                        {schoolName}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">{userRole || 'Staff'}</p>
                </div>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                <p className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Menu
                </p>
                {visibleLinks.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                            'flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors font-medium text-sm',
                            isActive(link.href)
                                ? 'bg-primary text-white shadow-sm'
                                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        )}
                    >
                        <link.icon size={18} />
                        <span>{link.label}</span>
                    </Link>
                ))}
            </nav>

            <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                <div className="mb-3 px-4">
                    <p className="text-sm font-medium text-white truncate">{userName}</p>
                    <p className="text-xs text-slate-400 truncate">{userRole || 'Staff'}</p>
                </div>
                <Link
                    href="/school/settings/account"
                    className={cn(
                        'flex items-center space-x-3 px-4 py-2 w-full text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-colors font-medium text-sm mb-1',
                        isActive('/school/settings/account') && 'bg-primary text-white',
                    )}
                >
                    <UserCog size={18} />
                    <span>Account</span>
                </Link>
                <form action={logout}>
                    <button className="flex items-center space-x-3 px-4 py-2 w-full text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors font-medium text-sm">
                        <LogOut size={18} />
                        <span>Sign out</span>
                    </button>
                </form>
            </div>
        </aside>
    );
}
