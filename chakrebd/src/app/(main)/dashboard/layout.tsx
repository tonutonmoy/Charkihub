import Link from 'next/link';
import { LayoutDashboard, Heart, User, Settings, Bell } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const links = [
    { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/dashboard/favorites', label: 'Favorites', icon: Heart },
    { href: '/dashboard/profile', label: 'Profile', icon: User },
    { href: '/dashboard/notifications', label: 'Notifications', icon: Bell },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  ];
  return (
    <div className="pt-28 pb-16 min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 flex flex-col lg:flex-row gap-10">
        <aside className="lg:w-56 shrink-0">
          <nav className="flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm whitespace-nowrap border border-border/50 bg-card hover:bg-muted/50 transition-colors"
              >
                <l.icon className="w-4 h-4" />
                {l.label}
              </Link>
            ))}
          </nav>
        </aside>
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
