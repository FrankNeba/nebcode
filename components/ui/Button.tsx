import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, Props>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-900 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95';
    const variants = {
      primary: 'bg-neb-600 hover:bg-neb-500 text-white focus:ring-neb-500 shadow-lg shadow-neb-950/50',
      secondary: 'bg-dark-600 hover:bg-dark-500 text-white border border-dark-500 focus:ring-dark-400',
      ghost: 'hover:bg-dark-700 text-gray-400 hover:text-white focus:ring-dark-400',
      danger: 'bg-red-800 hover:bg-red-700 text-white focus:ring-red-600',
    };
    const sizes = { xs: 'text-xs px-2 py-1 h-6', sm: 'text-xs px-3 py-1.5 h-7', md: 'text-sm px-4 py-2 h-9', lg: 'text-sm px-6 py-3 h-11' };
    return (
      <button ref={ref} disabled={disabled || isLoading}
        className={cn(base, variants[variant], sizes[size], className)} {...props}>
        {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
