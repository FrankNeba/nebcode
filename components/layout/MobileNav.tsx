'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Code2, Database, User, Home, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MobileNav() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Home', icon: Home, href: '/dashboard' },
    { label: 'Courses', icon: BookOpen, href: '/courses' },
    { label: 'Editor', icon: Code2, href: '/editor' },
    { label: 'MySQL', icon: Database, href: '/mysql-lab' },
    { label: 'Profile', icon: User, href: '/dashboard/profile' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-dark-900/80 backdrop-blur-lg border-t border-dark-700 px-2 py-2 flex justify-around items-center z-[100] pb-[calc(8px+env(safe-area-inset-bottom))]">
      {navItems.map((item) => {
        // For Home tab, match exactly /dashboard or /dashboard/ but not sub-paths like /dashboard/profile
        const isActive = item.href === '/dashboard'
          ? pathname === '/dashboard'
          : pathname === item.href || pathname.startsWith(item.href + '/');
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1 transition-all duration-300 px-2 py-1 rounded-xl",
              isActive ? "text-neb-400 scale-110" : "text-gray-500 hover:text-gray-300"
            )}
          >
            <item.icon className={cn("h-[22px] w-[22px]", isActive && "drop-shadow-[0_0_8px_rgba(225,29,72,0.5)]")} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
