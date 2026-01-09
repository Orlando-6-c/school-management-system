'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout } from '@/actions/auth';
import { LayoutDashboard, Users, BookOpen, Settings, LogOut, GraduationCap, School, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SchoolSidebarProps {
    schoolName: string;
    schoolSlug: string;
    userName: string;
    userRole: string;
}

export function SchoolSidebar({ schoolName, schoolSlug, userName, userRole }: SchoolSidebarProps) {
    const pathname = usePathname();

    const isActive = (path: string) => {
        return pathname === path || pathname?.startsWith(`${path}/`);
    };

    const links = [
        { href: '/school', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/school/students', label: 'Students', icon: GraduationCap },
        { href: '/school/teachers', label: 'Teachers', icon: Users },
        { href: '/school/academics', label: 'Academics', icon: BookOpen },
        { href: '/school/finance', label: 'Finance', icon: DollarSign, roles: ['SchoolAdmin', 'Finance'] }, // New Finance link
        { href: '/school/settings', label: 'Settings', icon: Settings },
    ];

    return (
        <aside className="w-64 bg-slate-900 text-white flex flex-col fixed h-full z-10 box-border">
            {/* Brand Section */}
            <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
                <div className="bg-indigo-600 p-2 rounded-lg">
                    <School className="h-6 w-6 text-white" />
                </div>
                <div>
                    <h2 className="text-sm font-bold text-white leading-tight" title={schoolName}>
                        {schoolName}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">School Admin</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                <p className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Menu
                </p>
                {links.map((link) => {
                    // Check if link has roles defined and if current user has one of them
                    if (link.roles && !link.roles.includes(userRole)) {
                        return null;
                    }

                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors font-medium text-sm",
                                active
                                    ? "bg-indigo-600 text-white shadow-sm"
                                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                            )}
                        >
                            <link.icon size={18} />
                            <span>{link.label}</span>
                        </Link>
                    )
                })}
            </nav>

            {/* User Info & Logout */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                <div className="mb-4 px-4">
                    <p className="text-sm font-medium text-white truncate">{userName}</p>
                    <p className="text-xs text-slate-400 truncate">{userRole || 'Admin'}</p>
                </div>
                <form action={logout}>
                    <button
                        className="flex items-center space-x-3 px-4 py-2 w-full text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors font-medium text-sm"
                    >
                        <LogOut size={18} />
                        <span>Sign out</span>
                    </button>
                </form>
            </div>
        </aside>
    );
}
