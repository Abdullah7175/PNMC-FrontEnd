'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Shield,
  Key,
  FileText,
  MapPin,
  GraduationCap,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { NAV_ITEMS } from '@/lib/navigation';
import { hasPermission } from '@/lib/api';
import clsx from 'clsx';

const ICONS = {
  LayoutDashboard,
  ClipboardList,
  Users,
  Shield,
  Key,
  FileText,
  MapPin,
  GraduationCap,
};

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const visibleItems = NAV_ITEMS.filter((item) =>
    hasPermission(user, item.permission),
  );

  const roleLabel =
    user?.roles
      ?.map((r) => {
        if (r.code === 'admin') return 'Admin';
        if (r.code === 'supervisor') return 'Supervisor';
        return r.name;
      })
      .join(', ') || 'User';

  return (
    <aside className="w-64 min-h-screen bg-white text-foreground flex flex-col border-r border-border">
      <div className="p-5 border-b border-border flex flex-col items-center text-center">
        <Image
          src="/pnmc-logo.png"
          alt="PNMC"
          width={72}
          height={72}
          className="mb-2"
          priority
        />
        <h1 className="text-sm font-bold tracking-tight text-pnmc-blue">
          {roleLabel}
        </h1>
        <p className="text-xs text-muted mt-0.5 truncate max-w-full px-1">
          {user?.fullName}
        </p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {visibleItems.map((item) => {
          const Icon = ICONS[item.icon as keyof typeof ICONS];
          const active =
            pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition',
                active
                  ? 'bg-pnmc-blue text-white'
                  : 'text-foreground/80 hover:bg-[#f0f4f8]',
              )}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <button
          onClick={logout}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-muted hover:bg-[#f0f4f8] hover:text-pnmc-blue rounded-lg transition"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
