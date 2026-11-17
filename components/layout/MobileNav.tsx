'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Code2,
  Database,
  User,
  Home,
  BookOpen,
  FileCheck2,
  Globe,
  Table2,
  KeyRound,
  Terminal,
  X,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const LAB_ITEMS = [
  {
    label: 'C & Python Editor',
    desc: 'Write, compile & run programs',
    href: '/editor',
    icon: Code2,
    color: 'text-neb-400 bg-neb-500/15 border-neb-500/30',
  },
  {
    label: 'MySQL Database Lab',
    desc: 'Practice SQL queries in a live terminal',
    href: '/mysql-lab',
    icon: Database,
    color: 'text-amber-400 bg-amber-500/15 border-amber-500/30',
  },
  {
    label: 'Web Lab (HTML/CSS/JS)',
    desc: 'Multi-file web editor & browser preview',
    href: '/web-lab',
    icon: Globe,
    color: 'text-sky-400 bg-sky-500/15 border-sky-500/30',
  },
  {
    label: 'Excel Spreadsheet Lab',
    desc: 'Formulas, VLOOKUP, IF, RANK & charts',
    href: '/excel-lab',
    icon: Table2,
    color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
  },
  {
    label: 'Microsoft Access Lab',
    desc: 'Tables, validation rules, relationships & SQL',
    href: '/access-lab',
    icon: KeyRound,
    color: 'text-rose-400 bg-rose-500/15 border-rose-500/30',
  },
];

export function MobileNav() {
  const pathname = usePathname();
  const [showLabsSheet, setShowLabsSheet] = useState(false);

  const isOnAnyLab =
    pathname.startsWith('/editor') ||
    pathname.startsWith('/mysql-lab') ||
    pathname.startsWith('/web-lab') ||
    pathname.startsWith('/excel-lab') ||
    pathname.startsWith('/access-lab');

  return (
    <>
      {/* Practice Labs Quick-Launcher Bottom Sheet */}
      {showLabsSheet && (
        <div
          className="md:hidden fixed inset-0 z-[110] bg-black/60 backdrop-blur-xs flex flex-col justify-end"
          onClick={() => setShowLabsSheet(false)}
        >
          <div
            className="bg-dark-900 border-t border-dark-700 rounded-t-2xl p-4 pb-24 space-y-3 shadow-2xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-dark-800">
              <div>
                <h3 className="text-sm font-extrabold text-white">Practice Labs</h3>
                <p className="text-[11px] text-gray-400">
                  Choose a practice environment to open
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowLabsSheet(false)}
                className="p-1.5 rounded-lg bg-dark-800 text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {LAB_ITEMS.map((lab) => {
                const Icon = lab.icon;
                const active = pathname === lab.href || pathname.startsWith(`${lab.href}/`);
                return (
                  <Link
                    key={lab.href}
                    href={lab.href}
                    onClick={() => setShowLabsSheet(false)}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-xl border transition-all active:scale-[0.99]',
                      active
                        ? 'bg-neb-600/15 border-neb-500/50'
                        : 'bg-dark-950 border-dark-800 hover:border-dark-700'
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          'w-10 h-10 rounded-xl border flex items-center justify-center shrink-0',
                          lab.color
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{lab.label}</p>
                        <p className="text-[11px] text-gray-400 truncate">{lab.desc}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-500 shrink-0" />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Clean 5-Tab Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-dark-900/95 backdrop-blur-lg border-t border-dark-700 px-2 py-1.5 flex justify-around items-center z-[115] pb-[calc(6px+env(safe-area-inset-bottom))]">
        <Link
          href="/dashboard"
          onClick={() => setShowLabsSheet(false)}
          className={cn(
            'flex flex-col items-center gap-0.5 transition-all duration-200 px-3 py-1 rounded-xl',
            pathname === '/dashboard'
              ? 'text-neb-400 scale-105 font-bold'
              : 'text-gray-500 hover:text-gray-300'
          )}
        >
          <Home className="h-5 w-5" />
          <span className="text-[10px] font-medium">Home</span>
        </Link>

        <Link
          href="/courses"
          onClick={() => setShowLabsSheet(false)}
          className={cn(
            'flex flex-col items-center gap-0.5 transition-all duration-200 px-3 py-1 rounded-xl',
            pathname === '/courses' || pathname.startsWith('/courses/')
              ? 'text-neb-400 scale-105 font-bold'
              : 'text-gray-500 hover:text-gray-300'
          )}
        >
          <BookOpen className="h-5 w-5" />
          <span className="text-[10px] font-medium">Courses</span>
        </Link>

        <button
          type="button"
          onClick={() => setShowLabsSheet((v) => !v)}
          className={cn(
            'flex flex-col items-center gap-0.5 transition-all duration-200 px-3 py-1 rounded-xl',
            isOnAnyLab || showLabsSheet
              ? 'text-neb-400 scale-105 font-bold'
              : 'text-gray-500 hover:text-gray-300'
          )}
        >
          <Terminal className="h-5 w-5" />
          <span className="text-[10px] font-medium">Labs</span>
        </button>

        <Link
          href="/mcq"
          onClick={() => setShowLabsSheet(false)}
          className={cn(
            'flex flex-col items-center gap-0.5 transition-all duration-200 px-3 py-1 rounded-xl',
            pathname === '/mcq' || pathname.startsWith('/mcq/')
              ? 'text-neb-400 scale-105 font-bold'
              : 'text-gray-500 hover:text-gray-300'
          )}
        >
          <FileCheck2 className="h-5 w-5" />
          <span className="text-[10px] font-medium">MCQs</span>
        </Link>

        <Link
          href="/dashboard/profile"
          onClick={() => setShowLabsSheet(false)}
          className={cn(
            'flex flex-col items-center gap-0.5 transition-all duration-200 px-3 py-1 rounded-xl',
            pathname === '/dashboard/profile' || pathname.startsWith('/dashboard/profile/')
              ? 'text-neb-400 scale-105 font-bold'
              : 'text-gray-500 hover:text-gray-300'
          )}
        >
          <User className="h-5 w-5" />
          <span className="text-[10px] font-medium">Profile</span>
        </Link>
      </nav>
    </>
  );
}
