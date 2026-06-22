'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { Code2, BookOpen, LayoutDashboard, LogOut, Menu, X, Terminal, ChevronDown, Bell } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { authService } from '@/services';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export function Navbar() {
  const { user, isAuthenticated, logout, fetchUser } = useAuthStore();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [drop, setDrop] = useState(false);

  // Notification states
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    // Validate session on mount
    const token = Cookies.get('access_token');
    if (token) fetchUser();
  }, [fetchUser]);

  const fetchNotifications = async () => {
    try {
      const { data } = await authService.getNotifications();
      setNotifications(data);
      setUnreadCount(data.filter((n: any) => !n.is_read).length);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 20000); // poll every 20s
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

  return (
    <nav className="sticky top-0 z-50 border-b border-dark-700 bg-dark-900/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-md bg-white overflow-hidden flex items-center justify-center shadow-lg shadow-neb-950/20 group-hover:scale-105 transition-transform">
            <img src="/logo.jpeg" alt="Nebcode Logo" className="w-full h-full object-cover" />
          </div>
          <span className="font-bold text-lg tracking-tight">
            <span className="text-neb-600">Neb</span>
            <span className="text-white">code</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          <Link href="/courses" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-dark-700 transition-all">
            <BookOpen className="h-4 w-4" /> Courses
          </Link>
          {isAuthenticated && (
            <>
              <Link href="/editor" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-dark-700 transition-all">
                <Code2 className="h-4 w-4" /> C Editor
              </Link>
              <Link href="/mysql-lab" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-dark-700 transition-all">
                <Terminal className="h-4 w-4" /> MySQL Lab
              </Link>
              <Link href="/dashboard" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-dark-700 transition-all">
                <LayoutDashboard className="h-4 w-4" /> Dashboard
              </Link>
            </>
          )}
        </div>

        <div className="hidden md:flex items-center gap-4">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    setDrop(false);
                  }}
                  className="p-1.5 rounded-lg hover:bg-dark-700 text-gray-400 hover:text-white transition-all relative"
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-neb-600 rounded-full border border-dark-900 animate-pulse"></span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 rounded-xl border border-dark-600 bg-dark-800 shadow-xl py-2 z-50 text-left">
                    <div className="px-4 py-1.5 border-b border-dark-700 flex justify-between items-center">
                      <span className="text-xs font-bold text-white">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="text-[10px] bg-neb-600/20 text-neb-450 px-2 py-0.5 rounded-full font-bold">
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
                                } catch (err) {
                                  console.error(err);
                                }
                              }
                            }}
                            className={cn(
                              "px-4 py-3 border-b border-dark-700/50 hover:bg-dark-700/50 transition cursor-pointer flex flex-col gap-0.5",
                              !n.is_read && "bg-neb-950/10 border-l-2 border-l-neb-600"
                            )}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <span className={cn("text-xs font-semibold", !n.is_read ? "text-white" : "text-gray-450")}>
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
                  onClick={() => {
                    setDrop(!drop);
                    setShowNotifications(false);
                  }}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-dark-700 transition-all"
                >
                  <div className="w-6 h-6 rounded-full bg-neb-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                    {(user?.full_name || user?.email || '?')[0].toUpperCase()}
                  </div>
                  <span className="text-sm text-gray-300 max-w-[100px] truncate">{user?.full_name || user?.email}</span>
                  <ChevronDown className="h-3 w-3 text-gray-500" />
                </button>

                {drop && (
                  <div className="absolute right-0 mt-1 w-44 rounded-xl border border-dark-600 bg-dark-800 shadow-xl py-1 z-50">
                    {user?.is_staff && (
                      <Link
                        href="/dashboard/admin"
                        className="flex items-center gap-2 px-3 py-2 text-sm text-neb-400 hover:text-neb-300 hover:bg-dark-700 font-semibold"
                        onClick={() => setDrop(false)}
                      >
                        Admin Panel
                      </Link>
                    )}
                    <Link
                      href="/dashboard/profile"
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-dark-700"
                      onClick={() => setDrop(false)}
                    >
                      Profile
                    </Link>
                    <hr className="border-dark-600 my-1" />
                    <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-dark-700">
                      <LogOut className="h-3.5 w-3.5" /> Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">Sign in</Button>
              </Link>
              <Link href="/auth/register">
                <Button size="sm">Get started</Button>
              </Link>
            </>
          )}
        </div>

        <button className="md:hidden p-2 text-gray-400 hover:text-white" onClick={() => setOpen(!open)}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-dark-700 bg-dark-800 animate-slide-up">
          <div className="px-4 py-3 flex flex-col gap-1">
            <Link href="/courses" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-dark-700 text-sm" onClick={() => setOpen(false)}>
              <BookOpen className="h-4 w-4" /> Courses
            </Link>
            {isAuthenticated && (
              <>
                <Link href="/editor" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-dark-700 text-sm" onClick={() => setOpen(false)}>
                  <Code2 className="h-4 w-4" /> C Editor
                </Link>
                <Link href="/mysql-lab" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-dark-700 text-sm" onClick={() => setOpen(false)}>
                  <Terminal className="h-4 w-4" /> MySQL Lab
                </Link>
                <Link href="/dashboard" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-dark-700 text-sm" onClick={() => setOpen(false)}>
                  <LayoutDashboard className="h-4 w-4" /> Dashboard
                </Link>
                {user?.is_staff && (
                  <Link href="/dashboard/admin" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-neb-400 hover:bg-dark-700 text-sm font-semibold" onClick={() => setOpen(false)}>
                    Admin Panel
                  </Link>
                )}
              </>
            )}
            <hr className="border-dark-700 my-1" />
            {isAuthenticated ? (
              <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-red-400 hover:bg-dark-700 text-sm w-full text-left">
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            ) : (
              <div className="flex gap-2 pt-1">
                <Link href="/auth/login" className="flex-1" onClick={() => setOpen(false)}>
                  <Button variant="secondary" className="w-full" size="sm">Sign in</Button>
                </Link>
                <Link href="/auth/register" className="flex-1" onClick={() => setOpen(false)}>
                  <Button className="w-full" size="sm">Get started</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
