'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Clock,
  Calendar,
  Search,
  ShieldCheck,
  Trophy,
  ArrowRight,
  History,
  AlertTriangle,
  BookOpen,
} from 'lucide-react';
import { mcqService } from '@/services';
import { useAuthStore } from '@/store/auth.store';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function MCQPapersClient({ initialPapers = [] }: { initialPapers?: any[] }) {
  const { isAuthenticated } = useAuthStore();
  const [papers, setPapers] = useState<any[]>(initialPapers);
  const [myAttempts, setMyAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(initialPapers.length === 0);
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      if (papers.length === 0) setLoading(true);
      try {
        const { data } = await mcqService.getPapers();
        setPapers(Array.isArray(data) ? data : data?.results || []);
        if (isAuthenticated) {
          mcqService
            .getMyAttempts()
            .then((res) => setMyAttempts(Array.isArray(res.data) ? res.data : []))
            .catch(() => {});
        }
      } catch {
        if (papers.length === 0) toast.error('Failed to load MCQ papers');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [isAuthenticated]);

  const years = Array.from(new Set(papers.map((p) => String(p.year)))).sort((a, b) => Number(b) - Number(a));

  const filteredPapers = papers.filter((p) => {
    if (selectedYear !== 'all' && String(p.year) !== selectedYear) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        p.name?.toLowerCase().includes(q) ||
        String(p.year).includes(q) ||
        p.description?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-10 pb-28 animate-in fade-in duration-300">
      {/* Hero Banner */}
      <div className="relative rounded-3xl bg-gradient-to-br from-neb-950/60 via-dark-900 to-dark-950 border border-neb-800/40 p-6 md:p-8 mb-6 overflow-hidden shadow-xl">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-neb-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neb-600/15 border border-neb-600/30 text-neb-400 text-[11px] font-bold uppercase tracking-wider">
              <ShieldCheck className="h-3.5 w-3.5 text-neb-400" />
              Timed Exam Practice
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              MCQ Past Papers &amp; Timed Tests
            </h1>
            <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">
              Practice 50-question exam papers under real timed fullscreen conditions. Instant grading with step-by-step explanations for every question.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 shrink-0">
            <div className="p-3.5 rounded-2xl bg-dark-900 border border-dark-700 text-center">
              <p className="text-xl sm:text-2xl font-extrabold text-white">{papers.length}</p>
              <p className="text-[11px] text-gray-400">Available Papers</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-dark-900 border border-dark-700 text-center">
              <p className="text-xl sm:text-2xl font-extrabold text-neb-500">50</p>
              <p className="text-[11px] text-gray-400">Questions / Paper</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Year Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="h-4 w-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search paper by name or year (e.g. 2024, Computer Science)..."
            className="w-full bg-dark-900 border border-dark-700 rounded-2xl pl-10 pr-4 py-3 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-neb-600 transition"
          />
        </div>

        {/* Year Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setSelectedYear('all')}
            className={cn(
              'px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0 border',
              selectedYear === 'all'
                ? 'bg-neb-600 border-neb-500 text-white shadow-md'
                : 'bg-dark-900 border-dark-700 text-gray-400 hover:text-white'
            )}
          >
            All Years
          </button>
          {years.map((yr) => (
            <button
              key={yr}
              type="button"
              onClick={() => setSelectedYear(yr)}
              className={cn(
                'px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0 border flex items-center gap-1',
                selectedYear === yr
                  ? 'bg-neb-600 border-neb-500 text-white shadow-md'
                  : 'bg-dark-900 border-dark-700 text-gray-400 hover:text-white'
              )}
            >
              <Calendar className="h-3 w-3" /> {yr}
            </button>
          ))}
        </div>
      </div>

      {/* Papers Grid */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <Spinner className="h-8 w-8" />
        </div>
      ) : filteredPapers.length === 0 ? (
        <div className="bg-dark-900 border border-dark-700 rounded-2xl p-12 text-center">
          <BookOpen className="h-12 w-12 text-gray-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No MCQ Papers Found</h3>
          <p className="text-xs text-gray-400 mt-1">
            {search || selectedYear !== 'all'
              ? 'Try clearing your search or selecting another year.'
              : 'New MCQ papers will appear here once uploaded.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPapers.map((paper) => {
            const hasAttempted = (paper.user_attempts_count || 0) > 0;
            return (
              <div
                key={paper.id}
                className="group bg-dark-900 border border-dark-700 hover:border-neb-600/60 rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all duration-200 hover:shadow-xl hover:shadow-neb-950/10"
              >
                <div className="space-y-3">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-1 rounded-lg bg-neb-600/15 border border-neb-600/30 text-neb-500 text-xs font-extrabold flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {paper.year}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-dark-800 border border-dark-700 text-amber-500 text-xs font-bold flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {paper.duration_minutes} mins
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-dark-800 border border-dark-700 text-gray-300 text-xs font-semibold">
                        {paper.question_count || 50} Questions
                      </span>
                    </div>

                    {hasAttempted && paper.user_best_score !== null && (
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 text-xs font-bold flex items-center gap-1">
                        <Trophy className="h-3 w-3 text-amber-500" />
                        Best: {paper.user_best_score}/{paper.question_count || 50} ({paper.user_best_percentage}%)
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h2 className="text-base sm:text-lg font-extrabold text-white group-hover:text-neb-500 transition">
                      {paper.name}
                    </h2>
                    {paper.description && (
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                        {paper.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer Action */}
                <div className="pt-3 border-t border-dark-700 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>Fullscreen Exam • Instant Explanations</span>
                  </div>

                  <Link
                    href={`/mcq/${paper.id}`}
                    className="px-4 py-2.5 rounded-xl bg-neb-600 hover:bg-neb-500 active:scale-95 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-neb-950/20 shrink-0"
                  >
                    <span>{hasAttempted ? 'Retake / Review' : 'Start Paper'}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Recent Attempts Section */}
      {isAuthenticated && myAttempts.length > 0 && (
        <div className="mt-10 space-y-4">
          <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
            <History className="h-5 w-5 text-neb-500" /> Your Recent Test Results
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {myAttempts.slice(0, 6).map((att) => (
              <Link
                key={att.id}
                href={`/mcq/${att.paper}?attemptId=${att.id}`}
                className="p-4 rounded-2xl bg-dark-900 border border-dark-700 hover:border-neb-600/50 transition flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-neb-600/15 text-neb-500 border border-neb-600/30">
                      {att.paper_year}
                    </span>
                    {att.auto_submitted && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-500 flex items-center gap-0.5">
                        <AlertTriangle className="h-2.5 w-2.5" /> Auto-Submitted
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-white truncate">{att.paper_name}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    {new Date(att.started_at).toLocaleDateString()} • View Corrections
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span
                    className={cn(
                      'text-sm font-extrabold px-2.5 py-1 rounded-xl border block',
                      att.percentage >= 50
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-500'
                        : 'bg-red-500/15 border-red-500/30 text-red-500'
                    )}
                  >
                    {att.score}/{att.total_questions}
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono mt-0.5 block">
                    {Math.round(att.percentage)}%
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
