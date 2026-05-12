'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Code2, BookOpen, LayoutDashboard, LogOut, Menu, X, Terminal, ChevronDown } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [drop, setDrop] = useState(false);

  const handleLogout = async () => { await logout(); router.push('/auth/login'); };

  return (
    <nav className="sticky top-0 z-50 border-b border-dark-700 bg-dark-900/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-md bg-white overflow-hidden flex items-center justify-center shadow-lg shadow-neb-950/20 group-hover:scale-105 transition-transform">
            <img src="/logo.jpeg" alt="Nebcode Logo" className="w-full h-full object-cover" />
          </div>
          <span className="font-bold text-lg tracking-tight"><span className="text-neb-600">Neb</span><span className="text-white">code</span></span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          <Link href="/courses" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-dark-700 transition-all">
            <BookOpen className="h-4 w-4" /> Courses
          </Link>
          {isAuthenticated && <>
            <Link href="/editor" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-dark-700 transition-all">
              <Code2 className="h-4 w-4" /> C Editor
            </Link>
            <Link href="/mysql-lab" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-dark-700 transition-all">
              <Terminal className="h-4 w-4" /> MySQL Lab
            </Link>
            <Link href="/dashboard" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-dark-700 transition-all">
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </Link>
          </>}
        </div>

        <div className="hidden md:flex items-center gap-2">
          {isAuthenticated ? (
            <div className="relative">
              <button onClick={() => setDrop(!drop)} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-dark-700 transition-all">
                <div className="w-6 h-6 rounded-full bg-neb-600 flex items-center justify-center text-xs font-bold text-white">
                  {(user?.full_name || user?.email || '?')[0].toUpperCase()}
                </div>
                <span className="text-sm text-gray-300 max-w-[100px] truncate">{user?.full_name || user?.email}</span>
                <ChevronDown className="h-3 w-3 text-gray-500" />
              </button>
              {drop && (
                <div className="absolute right-0 mt-1 w-44 rounded-xl border border-dark-600 bg-dark-800 shadow-xl py-1 animate-fade-in">
                  <Link href="/dashboard/profile" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-dark-700" onClick={() => setDrop(false)}>Profile</Link>
                  <hr className="border-dark-600 my-1" />
                  <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-dark-700">
                    <LogOut className="h-3.5 w-3.5" /> Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/auth/login"><Button variant="ghost" size="sm">Sign in</Button></Link>
              <Link href="/auth/register"><Button size="sm">Get started</Button></Link>
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
            {isAuthenticated && <>
              <Link href="/editor" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-dark-700 text-sm" onClick={() => setOpen(false)}>
                <Code2 className="h-4 w-4" /> C Editor
              </Link>
              <Link href="/mysql-lab" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-dark-700 text-sm" onClick={() => setOpen(false)}>
                <Terminal className="h-4 w-4" /> MySQL Lab
              </Link>
              <Link href="/dashboard" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-dark-700 text-sm" onClick={() => setOpen(false)}>
                <LayoutDashboard className="h-4 w-4" /> Dashboard
              </Link>
            </>}
            <hr className="border-dark-700 my-1" />
            {isAuthenticated ? (
              <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-red-400 hover:bg-dark-700 text-sm w-full text-left">
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            ) : (
              <div className="flex gap-2 pt-1">
                <Link href="/auth/login" className="flex-1" onClick={() => setOpen(false)}><Button variant="secondary" className="w-full" size="sm">Sign in</Button></Link>
                <Link href="/auth/register" className="flex-1" onClick={() => setOpen(false)}><Button className="w-full" size="sm">Get started</Button></Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
