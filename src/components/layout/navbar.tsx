'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';
import { Menu, X, LogOut, User, LayoutDashboard, Compass, History, Flame, Shield } from 'lucide-react';
import { useUserStats } from '@/hooks/use-profile';
import { cn } from '@/lib/utils';
import { NotificationBell } from './notification-bell';
import { Logo } from './logo';

const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/explore', label: 'Explore', icon: Compass },
  { href: '/contributions', label: 'Contributions', icon: History },
];

export function Navbar() {
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: stats } = useUserStats();
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Logo href={session ? '/dashboard' : '/'} />

        {/* Desktop Nav - centered pill navigation */}
        {session && (
          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'rounded-full px-3.5 py-1.5 text-sm transition-colors',
                    isActive
                      ? 'bg-secondary font-medium text-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        )}

        {/* Right side */}
        <div className="flex items-center gap-3">
          {session ? (
            <>
              {/* Streak */}
              {stats && stats.currentStreak > 0 && (
                <div className="hidden items-center gap-1 rounded-full border border-border px-2.5 py-1 sm:flex" title={`${stats.currentStreak} week streak`}>
                  <Flame className="h-3.5 w-3.5 text-orange-500" />
                  <span className="text-xs font-medium">{stats.currentStreak}</span>
                </div>
              )}

              {/* Notifications */}
              <NotificationBell />

              {/* Admin link - only for admins */}
              {session.user?.isAdmin && (
                <Link
                  href="/admin"
                  className="hidden rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground sm:block"
                  title="Admin Panel"
                >
                  <Shield className="h-4 w-4" />
                </Link>
              )}

              {/* Profile avatar */}
              <Link
                href="/profile"
                className="flex items-center gap-2 transition-opacity hover:opacity-80"
              >
                {session.user?.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name || ''}
                    className="h-7 w-7 rounded-full ring-1 ring-border"
                  />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary ring-1 ring-border">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                )}
              </Link>

              {/* Logout */}
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>

              {/* Mobile menu toggle */}
              <button
                className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <a
                href="https://github.com/shirsenduda/DevContrib/discussions"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Feedback
              </a>
              <Link
                href="/login"
                className="rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition-all hover:opacity-90"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileMenuOpen && session && (
        <div className="border-t border-border px-6 pb-4 pt-2 md:hidden">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors',
                  isActive
                    ? 'bg-secondary font-medium text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
