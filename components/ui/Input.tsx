import { cn } from '@/lib/utils';
import { InputHTMLAttributes, forwardRef } from 'react';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string; error?: string; helperText?: string; suffix?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, Props>(
  ({ className, label, error, helperText, id, suffix, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && <label htmlFor={inputId} className="text-sm font-medium text-gray-300">{label}</label>}
        <div className="relative">
          <input ref={ref} id={inputId}
            className={cn('w-full px-3 py-2.5 text-sm rounded-lg border bg-dark-700 text-white placeholder-gray-600 transition-all',
              'focus:outline-none focus:ring-2 focus:ring-neb-500 focus:border-transparent',
              suffix ? 'pr-10' : '',
              error ? 'border-red-500' : 'border-dark-500 hover:border-dark-400', className)}
            {...props} />
          {suffix && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              {suffix}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
        {helperText && !error && <p className="text-xs text-gray-500">{helperText}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
