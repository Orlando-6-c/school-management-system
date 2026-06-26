import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { logout } from '@/actions/auth';
import { LayoutDashboard, School, LogOut, Settings, ScrollText, ShieldAlert } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export const runtime = 'nodejs';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getSession();

    if (!session.isSuperAdmin) {
        redirect('/login');
    }

    const links = [
        { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/admin/schools', label: 'Schools', icon: School },
        { href: '/admin/audit-log', label: 'Audit Log', icon: ScrollText },
        { href: '/admin/settings', label: 'Settings', icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-muted flex">
            <aside
                className="w-64 flex flex-col fixed h-full z-10 border-r"
                style={{
                    backgroundColor: 'var(--sidebar)',
                    borderColor: 'var(--sidebar-border)',
                }}
            >
                {/* Header */}
                <div
                    className="flex items-center gap-3 px-5 h-16 border-b shrink-0"
                    style={{ borderColor: 'var(--sidebar-border)' }}
                >
                    <div
                        className="flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: 'oklch(0.55 0.22 250)', color: 'white' }}
                    >
                        <ShieldAlert size={16} />
                    </div>
                    <div>
                        <span
                            className="text-sm font-bold"
                            style={{ color: 'var(--sidebar-foreground)' }}
                        >
                            Super Admin
                        </span>
                        <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--sidebar-foreground)', opacity: 0.4 }}>
                            System
                        </p>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
                    <p
                        className="px-3 pt-1 pb-2 text-[10px] font-semibold uppercase tracking-widest"
                        style={{ color: 'var(--sidebar-foreground)', opacity: 0.35 }}
                    >
                        Admin
                    </p>
                    {links.map(({ href, label, icon: Icon }) => (
                        <Link
                            key={href}
                            href={href}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium opacity-75 hover:opacity-100 transition-colors"
                            style={{ color: 'var(--sidebar-foreground)' }}
                            onMouseEnter={(e) => {
                                (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--sidebar-accent)';
                            }}
                            onMouseLeave={(e) => {
                                (e.currentTarget as HTMLElement).style.backgroundColor = '';
                            }}
                        >
                            <Icon size={16} className="shrink-0" />
                            <span>{label}</span>
                        </Link>
                    ))}
                </nav>

                {/* Footer */}
                <div
                    className="px-3 py-4 border-t space-y-1 shrink-0"
                    style={{ borderColor: 'var(--sidebar-border)' }}
                >
                    <div className="flex items-center justify-between px-3 py-2">
                        <span className="text-xs font-medium" style={{ color: 'var(--sidebar-foreground)', opacity: 0.6 }}>
                            {session.username}
                        </span>
                        <ThemeToggle />
                    </div>
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

            <main className="flex-1 ml-64 p-8">{children}</main>
        </div>
    );
}
