'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Code2, Database, Home, BookOpen, FileCheck2, Globe, Table2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MobileNav() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Home', icon: Home, href: '/dashboard' },
    { label: 'Courses', icon: BookOpen, href: '/courses' },
    { label: 'MCQs', icon: FileCheck2, href: '/mcq' },
    { label: 'C Lab', icon: Code2, href: '/editor' },
    { label: 'MySQL', icon: Database, href: '/mysql-lab' },
    { label: 'Web Lab', icon: Globe, href: '/web-lab' },
    { label: 'Excel', icon: Table2, href: '/excel-lab' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-dark-900/90 backdrop-blur-lg border-t border-dark-700 px-1.5 py-1.5 flex justify-between items-center z-[100] pb-[calc(6px+env(safe-area-inset-bottom))] overflow-x-auto no-scrollbar">
      {navItems.map((item) => {
        const isActive =
          item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname === item.href || pathname.startsWith(item.href + '/');
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center gap-0.5 transition-all duration-200 px-2 py-1 rounded-xl shrink-0',
              isActive ? 'text-neb-400 scale-105 font-bold' : 'text-gray-500 hover:text-gray-300'
            )}
          >
            <item.icon
              className={cn(
                'h-[20px] w-[20px]',
                isActive && 'drop-shadow-[0_0_8px_rgba(225,29,72,0.5)]'
              )}
            />
            <span className="text-[9.5px] font-medium whitespace-nowrap">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
