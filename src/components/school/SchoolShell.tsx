'use client';

import { useState } from 'react';
import { SchoolSidebar, NavVisibility } from './SchoolSidebar';
import { Menu, School } from 'lucide-react';

interface SchoolShellProps {
    schoolName: string;
    schoolSlug: string;
    userName: string;
    userRole: string;
    nav: NavVisibility;
    children: React.ReactNode;
}

export function SchoolShell({ schoolName, schoolSlug, userName, userRole, nav, children }: SchoolShellProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-muted">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-20 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar wrapper — always visible on md+, slide-in on mobile */}
            <div
                className={`fixed inset-y-0 left-0 z-30 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <SchoolSidebar
                    schoolName={schoolName}
                    schoolSlug={schoolSlug}
                    userName={userName}
                    userRole={userRole}
                    nav={nav}
                    onCloseMobile={() => setSidebarOpen(false)}
                />
            </div>

            {/* Mobile top bar */}
            <header
                className="fixed top-0 left-0 right-0 h-14 flex items-center px-4 gap-3 border-b md:hidden z-10"
                style={{ backgroundColor: 'var(--sidebar)', borderColor: 'var(--sidebar-border)' }}
            >
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="p-2 rounded-lg transition-opacity hover:opacity-80"
                    style={{ color: 'var(--sidebar-foreground)' }}
                    aria-label="Open menu"
                >
                    <Menu size={20} />
                </button>
                <div className="flex items-center gap-2 min-w-0">
                    <div
                        className="h-6 w-6 rounded-md flex items-center justify-center shrink-0"
                        style={{
                            backgroundColor: 'var(--sidebar-primary)',
                            color: 'var(--sidebar-primary-foreground)',
                        }}
                    >
                        <School size={13} />
                    </div>
                    <span
                        className="text-sm font-bold truncate"
                        style={{ color: 'var(--sidebar-foreground)' }}
                    >
                        {schoolName}
                    </span>
                </div>
            </header>

            {/* Main content */}
            <main className="md:ml-64 pt-14 md:pt-0 min-h-screen">
                <div className="p-6 md:p-8">{children}</div>
            </main>
        </div>
    );
}
