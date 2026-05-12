'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, CheckCircle2, TrendingUp, Terminal, Code2, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { progressService, paymentService } from '@/services';
import { Spinner } from '@/components/ui/Spinner';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [purchases, setPurchases] = useState<any[]>([]);
  const [progress, setProgress] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([paymentService.getMyPurchases(), progressService.getMyProgress()])
      .then(([{ data: p }, { data: prog }]) => { setPurchases(p); setProgress(prog); })
      .finally(() => setLoading(false));
  }, []);

  const done = progress.filter(p => p.completed).length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="font-bold text-2xl text-white">Hey, {user?.full_name?.split(' ')[0] || 'learner'} 👋</h1>
        <p className="text-gray-500 text-sm mt-1">Keep up the momentum!</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { icon: BookOpen, label: 'Courses', value: purchases.length, color: 'text-neb-400' },
          { icon: CheckCircle2, label: 'Completed', value: done, color: 'text-emerald-400' },
          { icon: TrendingUp, label: 'In Progress', value: progress.length - done, color: 'text-amber-400' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="card p-4 flex flex-col gap-2">
            <Icon className={`h-4 w-4 ${color}`} />
            <p className="text-2xl font-bold text-white">{loading ? '—' : value}</p>
            <p className="text-xs text-gray-600">{label}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <Link href="/editor" className="card card-hover p-5 flex items-center gap-4 group">
          <div className="w-10 h-10 rounded-lg bg-neb-900/50 border border-neb-800/40 flex items-center justify-center shrink-0 group-hover:bg-neb-900 transition-colors">
            <Code2 className="h-5 w-5 text-neb-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white text-sm">C Editor</p>
            <p className="text-xs text-gray-500">Write and run C programs</p>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-600 group-hover:text-neb-400 transition-colors" />
        </Link>
        <Link href="/mysql-lab" className="card card-hover p-5 flex items-center gap-4 group">
          <div className="w-10 h-10 rounded-lg bg-emerald-900/30 border border-emerald-800/30 flex items-center justify-center shrink-0 group-hover:bg-emerald-900/50 transition-colors">
            <Terminal className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white text-sm">MySQL Lab</p>
            <p className="text-xs text-gray-500">Live MySQL terminal</p>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-600 group-hover:text-emerald-400 transition-colors" />
        </Link>
      </div>
      {!loading && purchases.length === 0 && (
        <div className="card p-8 text-center">
          <BookOpen className="h-10 w-10 text-dark-500 mx-auto mb-3" />
          <p className="text-gray-500 text-sm mb-4">No courses yet. Start learning!</p>
          <Link href="/courses" className="inline-flex items-center gap-1.5 text-sm text-neb-400 hover:text-neb-300 font-medium">Browse courses <ArrowRight className="h-4 w-4" /></Link>
        </div>
      )}
    </div>
  );
}
