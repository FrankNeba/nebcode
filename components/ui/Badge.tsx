import { cn } from '@/lib/utils';
export function Badge({ children, variant = 'default', className }: { children: React.ReactNode; variant?: string; className?: string }) {
  const v: Record<string, string> = {
    default: 'bg-dark-600 text-gray-300 border-dark-500',
    secondary: 'bg-dark-800 text-gray-400 border-dark-700',
    success: 'bg-emerald-900/40 text-emerald-400 border-emerald-800',
    warning: 'bg-amber-900/40 text-amber-400 border-amber-800',
    danger: 'bg-red-900/40 text-red-400 border-red-800',
    info: 'bg-neb-900/40 text-neb-400 border-neb-800',
  };
  return <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border', v[variant] || v.default, className)}>{children}</span>;
}
