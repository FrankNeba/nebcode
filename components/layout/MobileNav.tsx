'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Code2, Database, User, LayoutDashboard, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MobileNav() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Courses', icon: BookOpen, href: '/courses' },
    { label: 'Editor', icon: Code2, href: '/editor' },
    { label: 'MySQL', icon: Database, href: '/mysql-lab' },
    { label: 'Profile', icon: User, href: '/dashboard/profile' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-dark-900/80 backdrop-blur-lg border-t border-dark-700 px-6 py-2 flex justify-between items-center z-[100] pb-[calc(8px+env(safe-area-inset-bottom))]">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1 transition-all duration-300",
              isActive ? "text-neb-400 scale-110" : "text-gray-500 hover:text-gray-300"
            )}
          >
            <item.icon className={cn("h-6 w-6", isActive && "drop-shadow-[0_0_8px_rgba(225,29,72,0.5)]")} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
