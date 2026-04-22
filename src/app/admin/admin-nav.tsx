"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Images, BarChart3, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/images', label: 'Images', icon: Images },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <>
      {navItems.map((item) => {
        const isActive =
          item.href === '/admin'
            ? pathname === '/admin'
            : pathname?.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 md:py-2.5 rounded-lg text-sm transition-colors',
              isActive
                ? 'bg-zinc-800 text-zinc-100 font-medium'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/80'
            )}
          >
            <item.icon
              size={16}
              className={isActive ? 'text-zinc-100' : 'text-zinc-400'}
            />
            <span className="hidden md:block">{item.label}</span>
          </Link>
        );
      })}
    </>
  );
}
