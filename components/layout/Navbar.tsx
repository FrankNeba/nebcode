'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Cookies from 'js-cookie';
import { useRouter, usePathname } from 'next/navigation';
import {
  Code2,
  BookOpen,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  Database,
  ChevronDown,
  Bell,
  FileCheck2,
  Sun,
  Moon,
  CreditCard,
  Phone,
  Shield,
  User,
  Globe,
  Table2,
  KeyRound,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useThemeStore } from '@/store/theme.store';
import { authService } from '@/services';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export function Navbar() {
  const { user, isAuthenticated, logout, fetchUser } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [drop, setDrop] = useState(false);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const token = Cookies.get('access_token');
    if (token) fetchUser();
  }, [fetchUser]);

  const fetchNotifications = async () => {
    try {
      const { data } = await authService.getNotifications();
      setNotifications(data);
      setUnreadCount(data.filter((n: any) => !n.is_read).length);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated]);

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  const isLinkActive = (href: string) =>
    href === '/dashboard'
      ? pathname === '/dashboard'
      : pathname === href || pathname.startsWith(`${href}/`);

  const navLinkClass = (href: string) =>
    cn(
      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
      isLinkActive(href)
        ? 'bg-neb-600/15 text-neb-500 font-semibold'
        : 'text-gray-400 hover:text-white hover:bg-dark-800'
    );

  return (
    <nav className="sticky top-0 z-50 border-b border-dark-700 bg-dark-900/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-white overflow-hidden flex items-center justify-center shadow-sm border border-dark-700 group-hover:scale-105 transition-transform">
            <img src="/logo.jpeg" alt="Nebcode Logo" className="w-full h-full object-cover" />
          </div>
          <span className="font-extrabold text-lg tracking-tight">
            <span className="text-neb-600">Neb</span>
            <span className="text-white">code</span>
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-0.5 lg:gap-1">
          <Link href="/courses" className={navLinkClass('/courses')}>
            <BookOpen className="h-4 w-4" /> Courses
          </Link>
          <Link href="/mcq" className={navLinkClass('/mcq')}>
            <FileCheck2 className="h-4 w-4" /> MCQs
          </Link>
          <Link href="/editor" className={navLinkClass('/editor')}>
            <Code2 className="h-4 w-4" /> C Lab
          </Link>
          <Link href="/mysql-lab" className={navLinkClass('/mysql-lab')}>
            <Database className="h-4 w-4" /> MySQL Lab
          </Link>
          <Link href="/web-lab" className={navLinkClass('/web-lab')}>
            <Globe className="h-4 w-4" /> Web Lab
          </Link>
          <Link href="/excel-lab" className={navLinkClass('/excel-lab')}>
            <Table2 className="h-4 w-4" /> Excel Lab
          </Link>
          <Link href="/access-lab" className={navLinkClass('/access-lab')}>
            <KeyRound className="h-4 w-4" /> Access Lab
          </Link>
          {isAuthenticated && (
            <Link href="/dashboard" className={navLinkClass('/dashboard')}>
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </Link>
          )}
          <Link href="/pricing" className={navLinkClass('/pricing')}>
            <CreditCard className="h-4 w-4" /> Pricing
          </Link>
        </div>

        {/* Desktop Right Actions */}
        <div className="hidden md:flex items-center gap-2.5">
          {/* Light / Dark Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-dark-700 bg-dark-800 hover:bg-dark-700 text-gray-300 hover:text-white text-xs font-semibold transition-all"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle color theme"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="h-3.5 w-3.5 text-amber-400" />
                <span>Light</span>
              </>
            ) : (
              <>
                <Moon className="h-3.5 w-3.5 text-neb-600" />
                <span>Dark</span>
              </>
            )}
          </button>

          {isAuthenticated ? (
            <div className="flex items-center gap-2.5">
              {/* Notification Bell */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    setDrop(false);
                  }}
                  className="p-2 rounded-lg hover:bg-dark-800 text-gray-400 hover:text-white transition-all relative"
                  aria-label="Notifications"
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-neb-600 rounded-full border border-dark-900 animate-pulse" />
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 rounded-xl border border-dark-700 bg-dark-900 shadow-xl py-2 z-50 text-left">
                    <div className="px-4 py-1.5 border-b border-dark-700 flex justify-between items-center">
                      <span className="text-xs font-bold text-white">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="text-[10px] bg-neb-600/20 text-neb-500 px-2 py-0.5 rounded-full font-bold">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="text-center text-xs text-gray-500 py-6">No notifications yet.</p>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={async () => {
                              if (!n.is_read) {
                                try {
                                  await authService.markNotificationRead(n.id);
                                  fetchNotifications();
                                } catch {}
                              }
                            }}
                            className={cn(
                              'px-4 py-3 border-b border-dark-700/50 hover:bg-dark-800 transition cursor-pointer flex flex-col gap-0.5',
                              !n.is_read && 'bg-neb-600/10 border-l-2 border-l-neb-600'
                            )}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <span className={cn('text-xs font-semibold', !n.is_read ? 'text-white' : 'text-gray-400')}>
                                {n.title}
                              </span>
                              <span className="text-[9px] text-gray-500 shrink-0 font-mono">
                                {new Date(n.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-400 leading-relaxed">{n.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User profile dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setDrop(!drop);
                    setShowNotifications(false);
                  }}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-dark-800 border border-transparent hover:border-dark-700 transition-all"
                >
                  <div className="w-6 h-6 rounded-full bg-neb-600 flex items-center justify-center text-xs font-bold text-white keep-white shrink-0">
                    {(user?.full_name || user?.email || '?')[0].toUpperCase()}
                  </div>
                  <span className="text-sm text-gray-300 max-w-[110px] truncate font-medium">
                    {user?.full_name || user?.email}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
                </button>

                {drop && (
                  <div className="absolute right-0 mt-1 w-48 rounded-xl border border-dark-700 bg-dark-900 shadow-xl py-1.5 z-50">
                    {user?.is_staff && (
                      <Link
                        href="/dashboard/admin"
                        className="flex items-center gap-2 px-3.5 py-2 text-xs text-neb-500 hover:bg-dark-800 font-bold"
                        onClick={() => setDrop(false)}
                      >
                        <Shield className="h-3.5 w-3.5" /> Admin Dashboard
                      </Link>
                    )}
                    <Link
                      href="/dashboard/profile"
                      className="flex items-center gap-2 px-3.5 py-2 text-xs text-gray-300 hover:text-white hover:bg-dark-800 font-medium"
                      onClick={() => setDrop(false)}
                    >
                      <User className="h-3.5 w-3.5" /> My Profile
                    </Link>
                    <hr className="border-dark-700 my-1" />
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-red-500 hover:bg-dark-800 font-semibold"
                    >
                      <LogOut className="h-3.5 w-3.5" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link href="/auth/register">
                <Button size="sm">Start Free</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Right Actions (Theme Toggle + Menu Button) */}
        <div className="flex md:hidden items-center gap-1.5">
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-lg border border-dark-700 bg-dark-800 text-gray-300 hover:text-white transition"
            aria-label="Toggle color theme"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-neb-600" />
            )}
          </button>
          <button
            type="button"
            className="p-2 rounded-lg text-gray-400 hover:text-white"
            onClick={() => setOpen(!open)}
            aria-label="Open menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {open && (
        <div className="md:hidden border-t border-dark-700 bg-dark-900 animate-slide-up">
          <div className="px-4 py-3 flex flex-col gap-1">
            <Link
              href="/courses"
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-dark-800 text-sm font-medium"
              onClick={() => setOpen(false)}
            >
              <BookOpen className="h-4 w-4 text-neb-500" /> Courses
            </Link>
            <Link
              href="/mcq"
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-dark-800 text-sm font-medium"
              onClick={() => setOpen(false)}
            >
              <FileCheck2 className="h-4 w-4 text-neb-500" /> MCQ Past Papers
            </Link>
            <Link
              href="/editor"
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-dark-800 text-sm font-medium"
              onClick={() => setOpen(false)}
            >
              <Code2 className="h-4 w-4 text-neb-500" /> C &amp; Python Code Editor
            </Link>
            <Link
              href="/mysql-lab"
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-dark-800 text-sm font-medium"
              onClick={() => setOpen(false)}
            >
              <Database className="h-4 w-4 text-neb-500" /> MySQL Database Lab
            </Link>
            <Link
              href="/web-lab"
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-dark-800 text-sm font-medium"
              onClick={() => setOpen(false)}
            >
              <Globe className="h-4 w-4 text-neb-500" /> HTML, CSS &amp; JS Web Lab
            </Link>
            <Link
              href="/excel-lab"
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-dark-800 text-sm font-medium"
              onClick={() => setOpen(false)}
            >
              <Table2 className="h-4 w-4 text-neb-500" /> Excel Spreadsheet Lab
            </Link>
            <Link
              href="/access-lab"
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-dark-800 text-sm font-medium"
              onClick={() => setOpen(false)}
            >
              <KeyRound className="h-4 w-4 text-rose-400" /> MS Access Database Lab
            </Link>
            {isAuthenticated && (
              <>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-dark-800 text-sm font-medium"
                  onClick={() => setOpen(false)}
                >
                  <LayoutDashboard className="h-4 w-4 text-neb-500" /> Student Dashboard
                </Link>
                {user?.is_staff && (
                  <Link
                    href="/dashboard/admin"
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-neb-500 hover:bg-dark-800 text-sm font-bold"
                    onClick={() => setOpen(false)}
                  >
                    <Shield className="h-4 w-4" /> Admin Panel
                  </Link>
                )}
              </>
            )}
            <Link
              href="/pricing"
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-dark-800 text-sm font-medium"
              onClick={() => setOpen(false)}
            >
              <CreditCard className="h-4 w-4 text-neb-500" /> Pricing Plans
            </Link>
            <Link
              href="/contact"
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-dark-800 text-sm font-medium"
              onClick={() => setOpen(false)}
            >
              <Phone className="h-4 w-4 text-neb-500" /> Help &amp; Contact
            </Link>
            <hr className="border-dark-700 my-1.5" />
            {isAuthenticated ? (
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-red-500 hover:bg-dark-800 text-sm font-semibold w-full text-left"
              >
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            ) : (
              <div className="flex gap-2 pt-1">
                <Link href="/auth/login" className="flex-1" onClick={() => setOpen(false)}>
                  <Button variant="secondary" className="w-full" size="sm">Sign In</Button>
                </Link>
                <Link href="/auth/register" className="flex-1" onClick={() => setOpen(false)}>
                  <Button className="w-full" size="sm">Start Free</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
