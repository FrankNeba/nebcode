import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('animate-spin text-neb-400', className)} />;
}
export function PageLoader() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-dark-950 z-50 gap-4">
      <div className="text-3xl font-bold text-gradient font-mono">Nebcode</div>
      <Spinner className="h-8 w-8" />
    </div>
  );
}
