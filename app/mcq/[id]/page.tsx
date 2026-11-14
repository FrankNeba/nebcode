'use client';
import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldAlert,
  ShieldCheck,
  Clock,
  Calendar,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Trophy,
  Maximize2,
  LayoutGrid,
  Sparkles,
  BookOpen,
  AlertTriangle,
  ZoomIn,
  X,
  RotateCcw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { mcqService } from '@/services';
import { useAuthStore } from '@/store/auth.store';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { KatexRenderer } from '@/components/mcq/KatexRenderer';
import { cn } from '@/lib/utils';

type Phase = 'intro' | 'quiz' | 'result';

function formatDurationClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  if (hrs > 0) {
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

function formatTimeTaken(seconds: number): string {
  if (!seconds || seconds <= 0) return '0s';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

function MCQTestContent() {
  const { id: paperId } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const attemptIdParam = searchParams.get('attemptId');
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();

  const [paperMeta, setPaperMeta] = useState<any | null>(null);
  const [takeData, setTakeData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [startingTest, setStartingTest] = useState(false);
  const [phase, setPhase] = useState<Phase>('intro');

  // Quiz state
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [showGridSheet, setShowGridSheet] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Result state
  const [result, setResult] = useState<any | null>(null);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'correct' | 'incorrect' | 'unanswered'>('all');

  // Refs to ensure anti-cheat & timer callbacks always read latest state without re-binding listeners
  const answersRef = useRef<Record<string, number | null>>({});
  const startTimeRef = useRef<number>(0);
  const isSubmittingRef = useRef<boolean>(false);
  const phaseRef = useRef<Phase>('intro');
  const hadFullscreenRef = useRef<boolean>(false);
  const securityArmedRef = useRef<boolean>(false);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  // Load paper metadata (and optional past attempt result if attemptId query param is present)
  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        const { data } = await mcqService.getPaper(paperId);
        setPaperMeta(data);

        if (attemptIdParam) {
          try {
            const attRes = await mcqService.getAttempt(attemptIdParam);
            setResult(attRes.data);
            setPhase('result');
          } catch {
            // fallback to intro
          }
        }
      } catch {
        toast.error('MCQ Paper not found');
      } finally {
        setLoading(false);
      }
    }
    if (paperId) init();
  }, [paperId, attemptIdParam]);

  const exitBrowserFullscreen = useCallback(() => {
    try {
      const doc: any = document;
      if (doc.fullscreenElement || doc.webkitFullscreenElement) {
        if (doc.exitFullscreen) doc.exitFullscreen().catch(() => {});
        else if (doc.webkitExitFullscreen) doc.webkitExitFullscreen();
      }
    } catch {
      // ignore
    }
  }, []);

  const submitExamNow = useCallback(
    async (opts?: { autoSubmitted?: boolean; reason?: string }) => {
      if (isSubmittingRef.current || phaseRef.current !== 'quiz') return;
      isSubmittingRef.current = true;
      securityArmedRef.current = false;
      setSubmitting(true);
      setShowSubmitConfirm(false);
      setShowGridSheet(false);

      const elapsed = startTimeRef.current
        ? Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000))
        : 0;

      const autoSubmitted = !!opts?.autoSubmitted;
      const reason = opts?.reason || 'manual';

      try {
        const { data } = await mcqService.submitPaper(paperId, {
          answers: answersRef.current,
          time_taken_seconds: elapsed,
          auto_submitted: autoSubmitted,
          submission_reason: reason,
        });
        exitBrowserFullscreen();
        setResult(data);
        setPhase('result');
        if (autoSubmitted) {
          if (reason === 'timer_expired') {
            toast('Time is up! Your answers have been submitted.', { icon: '⏰', duration: 5000 });
          } else {
            toast.error('Security Lock: Test submitted automatically because you left fullscreen or switched apps.', {
              duration: 6000,
            });
          }
        } else {
          toast.success('Test submitted successfully!');
        }
      } catch (err: any) {
        toast.error(err?.response?.data?.detail || 'Failed to submit test');
        isSubmittingRef.current = false;
      } finally {
        setSubmitting(false);
      }
    },
    [paperId, exitBrowserFullscreen]
  );

  // Start the secure fullscreen exam
  const handleStartTest = async () => {
    if (!isAuthenticated && !authLoading) {
      toast.error('Please sign in to take this MCQ paper.');
      router.push('/auth/login');
      return;
    }

    setStartingTest(true);
    try {
      // Request Fullscreen immediately inside user gesture
      try {
        const el: any = document.documentElement;
        if (el.requestFullscreen) {
          await el.requestFullscreen();
          hadFullscreenRef.current = true;
        } else if (el.webkitRequestFullscreen) {
          el.webkitRequestFullscreen();
          hadFullscreenRef.current = true;
        }
      } catch {
        // Mobile browser may not support hardware fullscreen API; our fixed z-[9999] viewport lock still covers 100%
        hadFullscreenRef.current = false;
      }

      const { data } = await mcqService.takePaper(paperId);
      setTakeData(data);

      const initialAnswers: Record<string, number | null> = {};
      (data.questions || []).forEach((q: any) => {
        initialAnswers[String(q.id)] = null;
      });

      setAnswers(initialAnswers);
      answersRef.current = initialAnswers;
      setCurrentIdx(0);
      const durationSecs = (Number(data.duration_minutes) || 90) * 60;
      setRemainingSeconds(durationSecs);
      startTimeRef.current = Date.now();
      isSubmittingRef.current = false;
      setPhase('quiz');

      // Arm anti-cheat listeners after fullscreen transition settles
      setTimeout(() => {
        if (phaseRef.current === 'quiz') {
          securityArmedRef.current = true;
        }
      }, 750);
    } catch (err: any) {
      exitBrowserFullscreen();
      toast.error(err?.response?.data?.detail || 'Could not start test.');
    } finally {
      setStartingTest(false);
    }
  };

  // Countdown Timer Effect
  useEffect(() => {
    if (phase !== 'quiz') return;
    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          submitExamNow({ autoSubmitted: true, reason: 'timer_expired' });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, submitExamNow]);

  // Strict Anti-Exit / App-Switch / Fullscreen Exit Listeners
  useEffect(() => {
    if (phase !== 'quiz') return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && phaseRef.current === 'quiz') {
        submitExamNow({ autoSubmitted: true, reason: 'app_switch_or_fullscreen_exit' });
      }
    };

    const handleWindowBlur = () => {
      if (!securityArmedRef.current || phaseRef.current !== 'quiz') return;
      submitExamNow({ autoSubmitted: true, reason: 'app_switch_or_fullscreen_exit' });
    };

    const handleFullscreenChange = () => {
      const doc: any = document;
      const isFs = !!(doc.fullscreenElement || doc.webkitFullscreenElement);
      if (isFs) {
        hadFullscreenRef.current = true;
      } else if (hadFullscreenRef.current && securityArmedRef.current && phaseRef.current === 'quiz') {
        submitExamNow({ autoSubmitted: true, reason: 'app_switch_or_fullscreen_exit' });
      }
    };

    const handlePageHide = () => {
      if (phaseRef.current === 'quiz') {
        submitExamNow({ autoSubmitted: true, reason: 'app_switch_or_fullscreen_exit' });
      }
    };

    const preventCopyContext = (e: Event) => {
      e.preventDefault();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('contextmenu', preventCopyContext);
    document.addEventListener('copy', preventCopyContext);
    document.addEventListener('cut', preventCopyContext);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('contextmenu', preventCopyContext);
      document.removeEventListener('copy', preventCopyContext);
      document.removeEventListener('cut', preventCopyContext);
    };
  }, [phase, submitExamNow]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-56px)]">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!paperMeta) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-56px)] p-6 text-center">
        <XCircle className="h-12 w-12 text-red-500 mb-3" />
        <h2 className="text-xl font-bold text-white">MCQ Paper Not Found</h2>
        <Link href="/mcq" className="mt-4">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to MCQ Papers
          </Button>
        </Link>
      </div>
    );
  }

  const questions = takeData?.questions || [];
  const currentQuestion = questions[currentIdx];
  const answeredCount = Object.values(answers).filter((v) => v !== null && v !== undefined).length;

  const handleSelectOption = (questionId: string, optionIdx: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionIdx,
    }));
  };

  // ─── PHASE 1: INTRO / PRE-TEST BRIEFING ──────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 md:py-12 pb-28 animate-in fade-in duration-300">
        <Link
          href="/mcq"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-white mb-5 transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back to All MCQ Papers
        </Link>

        <div className="bg-dark-900 border border-dark-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Paper Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full bg-neb-950 border border-neb-700/50 text-neb-400 text-xs font-extrabold flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" /> Year {paperMeta.year}
            </span>
            <span className="px-3 py-1 rounded-full bg-dark-950 border border-dark-800 text-amber-400 text-xs font-bold flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> {paperMeta.duration_minutes} Minutes
            </span>
            <span className="px-3 py-1 rounded-full bg-dark-950 border border-dark-800 text-emerald-400 text-xs font-bold">
              {paperMeta.question_count || 50} Questions
            </span>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">{paperMeta.name}</h1>
            {paperMeta.description && (
              <p className="text-gray-400 text-xs sm:text-sm mt-2 leading-relaxed">{paperMeta.description}</p>
            )}
          </div>

          {/* Security Warning Box */}
          <div className="rounded-2xl bg-red-950/25 border border-red-800/40 p-5 space-y-3">
            <div className="flex items-center gap-2 text-red-300 font-extrabold text-sm">
              <ShieldAlert className="h-5 w-5 text-red-400 shrink-0" />
              <span>Strict Fullscreen Exam Rules</span>
            </div>
            <ul className="space-y-2 text-xs text-gray-300 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-neb-400 font-bold">1.</span>
                <span>
                  When you tap <strong>Start Secure Test</strong>, the paper opens in <strong>Full-Screen Mode</strong> and the timer ({paperMeta.duration_minutes} minutes) begins immediately.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-neb-400 font-bold">2.</span>
                <span>
                  <strong>Do NOT exit full screen, switch tabs, minimize the browser, or open another app</strong> on your phone or computer. Doing so will <strong>automatically submit your answers immediately</strong> and take you to your results.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-neb-400 font-bold">3.</span>
                <span>
                  After submitting, you will see your total score and a complete review of all {paperMeta.question_count || 50} questions showing the option you ticked, the correct option, and the full explanation.
                </span>
              </li>
            </ul>
          </div>

          {/* Start Button */}
          <Button
            onClick={handleStartTest}
            isLoading={startingTest}
            className="w-full py-4 rounded-2xl text-base font-extrabold bg-neb-600 hover:bg-neb-500 shadow-xl shadow-neb-950/40 flex items-center justify-center gap-2"
          >
            <Maximize2 className="h-5 w-5" />
            Start Secure Test ({paperMeta.duration_minutes} Mins)
          </Button>

          {/* Past Attempts for this Paper */}
          {paperMeta.my_attempts && paperMeta.my_attempts.length > 0 && (
            <div className="pt-4 border-t border-dark-800 space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Your Previous Attempts on This Paper
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {paperMeta.my_attempts.map((att: any) => (
                  <button
                    key={att.id}
                    type="button"
                    onClick={async () => {
                      try {
                        setLoading(true);
                        const res = await mcqService.getAttempt(att.id);
                        setResult(res.data);
                        setPhase('result');
                      } catch {
                        toast.error('Failed to load attempt');
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="w-full p-3 rounded-xl bg-dark-950 hover:bg-dark-800 border border-dark-800 flex items-center justify-between text-left transition"
                  >
                    <div>
                      <p className="text-xs font-bold text-white">
                        Score: {att.score} / {att.total_questions} ({Math.round(att.percentage)}%)
                      </p>
                      <p className="text-[10px] text-gray-500">
                        {new Date(att.started_at).toLocaleString()}
                        {att.auto_submitted ? ' • Auto-Submitted' : ''}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-neb-400">View Review →</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── PHASE 2: ACTIVE SECURE FULLSCREEN QUIZ ──────────────────────────────────
  if (phase === 'quiz' && currentQuestion) {
    const qIdStr = String(currentQuestion.id);
    const selectedOpt = answers[qIdStr];
    const isUrgent = remainingSeconds <= 300; // < 5 mins
    const isCritical = remainingSeconds <= 60; // < 1 min

    return (
      <div className="fixed inset-0 z-[9999] bg-[#05050b] flex flex-col overflow-hidden select-none">
        {/* Top Sticky Proctoring & Timer Header */}
        <header className="bg-dark-900 border-b border-dark-800 px-3 sm:px-6 py-2.5 shrink-0">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
            {/* Paper Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-neb-400 truncate">
                  {paperMeta.year} • Secure Mode
                </span>
              </div>
              <h1 className="text-xs sm:text-sm font-bold text-white truncate">{paperMeta.name}</h1>
            </div>

            {/* Countdown Timer */}
            <div
              className={cn(
                'px-3 py-1.5 rounded-xl border font-mono text-xs sm:text-sm font-extrabold flex items-center gap-1.5 shrink-0 transition-colors',
                isCritical
                  ? 'bg-red-950/80 border-red-500 text-red-300 animate-pulse'
                  : isUrgent
                    ? 'bg-amber-950/70 border-amber-600/60 text-amber-300'
                    : 'bg-dark-950 border-dark-700 text-white'
              )}
            >
              <Clock className={cn('h-3.5 w-3.5', isCritical ? 'text-red-400' : isUrgent ? 'text-amber-400' : 'text-neb-400')} />
              <span>{formatDurationClock(remainingSeconds)}</span>
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={() => setShowSubmitConfirm(true)}
              disabled={submitting}
              className="px-3.5 py-1.5 rounded-xl bg-neb-600 hover:bg-neb-500 active:scale-95 text-white text-xs font-extrabold transition shadow-lg shadow-neb-950/40 shrink-0"
            >
              Submit ({answeredCount}/{questions.length})
            </button>
          </div>

          {/* Progress Bar */}
          <div className="max-w-5xl mx-auto mt-2 h-1 bg-dark-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-neb-600 to-emerald-500 transition-all duration-300"
              style={{ width: `${(answeredCount / Math.max(1, questions.length)) * 100}%` }}
            />
          </div>
        </header>

        {/* Horizontal Question Number Strip (Mobile-Friendly 1..50 Scroller) */}
        <div className="bg-[#090913] border-b border-dark-800/80 px-3 py-2 shrink-0">
          <div className="max-w-5xl mx-auto flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
            {questions.map((q: any, idx: number) => {
              const isAnswered = answers[String(q.id)] !== null && answers[String(q.id)] !== undefined;
              const isCurrent = idx === currentIdx;
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setCurrentIdx(idx)}
                  className={cn(
                    'w-8 h-8 rounded-lg text-xs font-extrabold flex items-center justify-center shrink-0 transition-all border',
                    isCurrent
                      ? 'bg-neb-600 border-neb-400 text-white scale-105 shadow-md shadow-neb-950/50'
                      : isAnswered
                        ? 'bg-emerald-950/50 border-emerald-700/50 text-emerald-300'
                        : 'bg-dark-900 border-dark-800 text-gray-400 hover:text-white'
                  )}
                >
                  {q.order || idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Scrollable Question & 4 Options Container */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-6">
          <div className="max-w-3xl mx-auto space-y-5 pb-10">
            {/* Question Header Badge */}
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-neb-950 border border-neb-800/60 text-neb-300 text-xs font-extrabold">
                Question {currentIdx + 1} of {questions.length}
              </span>
              {selectedOpt !== null && selectedOpt !== undefined ? (
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Option {['A', 'B', 'C', 'D'][selectedOpt]} Selected
                </span>
              ) : (
                <span className="text-xs text-gray-500">Tap an option below</span>
              )}
            </div>

            {/* Question Card */}
            <div className="bg-dark-900 border border-dark-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
              <div className="text-sm sm:text-base text-white leading-relaxed">
                <KatexRenderer content={currentQuestion.text} />
              </div>

              {/* Optional Question Image */}
              {currentQuestion.image && (
                <div className="relative rounded-xl overflow-hidden bg-dark-950 border border-dark-800 p-2 flex flex-col items-center">
                  <img
                    src={currentQuestion.image}
                    alt={`Question ${currentIdx + 1}`}
                    onClick={() => setZoomedImage(currentQuestion.image)}
                    className="max-h-64 sm:max-h-80 w-auto object-contain rounded-lg cursor-zoom-in"
                  />
                  <button
                    type="button"
                    onClick={() => setZoomedImage(currentQuestion.image)}
                    className="mt-2 px-2.5 py-1 rounded-lg bg-dark-800/90 text-[10px] font-semibold text-gray-300 flex items-center gap-1"
                  >
                    <ZoomIn className="h-3 w-3 text-neb-400" /> Tap image to zoom
                  </button>
                </div>
              )}
            </div>

            {/* 4 Options (A, B, C, D) */}
            <div className="grid grid-cols-1 gap-3">
              {(currentQuestion.options || []).slice(0, 4).map((optText: string, optIdx: number) => {
                const letter = ['A', 'B', 'C', 'D'][optIdx];
                const isSelected = selectedOpt === optIdx;
                const optImg = (currentQuestion.option_images || [])[optIdx] || null;

                return (
                  <div
                    key={optIdx}
                    onClick={() => handleSelectOption(qIdStr, optIdx)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSelectOption(qIdStr, optIdx);
                      }
                    }}
                    className={cn(
                      'w-full text-left p-4 sm:p-5 rounded-2xl border transition-all duration-150 cursor-pointer flex flex-col gap-3 active:scale-[0.99]',
                      isSelected
                        ? 'bg-neb-950/60 border-neb-500 shadow-lg shadow-neb-950/40 ring-1 ring-neb-500/50'
                        : 'bg-dark-900/90 border-dark-800 hover:border-dark-600 hover:bg-dark-850'
                    )}
                  >
                    <div className="flex items-start gap-3.5">
                      <span
                        className={cn(
                          'w-8 h-8 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center shrink-0 transition-colors mt-0.5',
                          isSelected
                            ? 'bg-neb-600 text-white shadow-md'
                            : 'bg-dark-800 text-gray-300 border border-dark-700'
                        )}
                      >
                        {letter}
                      </span>
                      <div className="flex-1 min-w-0 text-xs sm:text-sm text-gray-100 leading-relaxed pt-1">
                        <KatexRenderer content={optText} inline />
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="h-5 w-5 text-neb-400 shrink-0 mt-1" />
                      )}
                    </div>

                    {/* Optional Option Image */}
                    {optImg && (
                      <div className="pl-11 flex flex-col items-start gap-1.5">
                        <img
                          src={optImg}
                          alt={`Option ${letter}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setZoomedImage(optImg);
                          }}
                          className="max-h-44 sm:max-h-56 w-auto rounded-xl object-contain border border-dark-700 bg-dark-950 p-1.5"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setZoomedImage(optImg);
                          }}
                          className="text-[10px] text-gray-400 hover:text-white flex items-center gap-1"
                        >
                          <ZoomIn className="h-3 w-3" /> Enlarge Option {letter} Image
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Sticky Mobile Navigation Bar */}
        <footer className="bg-dark-900 border-t border-dark-800 px-3 sm:px-6 py-3 shrink-0 pb-[calc(12px+env(safe-area-inset-bottom))]">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-2.5">
            <button
              type="button"
              onClick={() => setCurrentIdx((c) => Math.max(0, c - 1))}
              disabled={currentIdx === 0}
              className="px-4 py-2.5 rounded-xl bg-dark-800 hover:bg-dark-700 disabled:opacity-30 text-gray-200 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition active:scale-95 border border-dark-700"
            >
              <ArrowLeft className="h-4 w-4" /> Prev
            </button>

            <button
              type="button"
              onClick={() => setShowGridSheet(true)}
              className="px-4 py-2.5 rounded-xl bg-dark-950 hover:bg-dark-800 text-gray-300 text-xs font-bold flex items-center gap-1.5 border border-dark-700 transition active:scale-95"
            >
              <LayoutGrid className="h-4 w-4 text-neb-400" />
              <span>
                {answeredCount}/{questions.length} Answered
              </span>
            </button>

            {currentIdx < questions.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentIdx((c) => Math.min(questions.length - 1, c + 1))}
                className="px-5 py-2.5 rounded-xl bg-neb-600 hover:bg-neb-500 text-white text-xs sm:text-sm font-extrabold flex items-center gap-1.5 transition active:scale-95 shadow-lg shadow-neb-950/40"
              >
                Next <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowSubmitConfirm(true)}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-extrabold flex items-center gap-1.5 transition active:scale-95 shadow-lg"
              >
                <CheckCircle2 className="h-4 w-4" /> Finish
              </button>
            )}
          </div>
        </footer>

        {/* 50-Question Grid Bottom Sheet Modal */}
        {showGridSheet && (
          <div className="fixed inset-0 z-[10000] bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="w-full max-w-lg bg-dark-900 border-t sm:border border-dark-700 rounded-t-3xl sm:rounded-3xl p-5 max-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-dark-800">
                <div>
                  <h3 className="text-sm font-extrabold text-white">Question Navigator</h3>
                  <p className="text-[11px] text-gray-400">
                    {answeredCount} answered • {questions.length - answeredCount} remaining
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGridSheet(false)}
                  className="p-1.5 rounded-lg bg-dark-800 text-gray-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 py-4 overflow-y-auto">
                {questions.map((q: any, idx: number) => {
                  const isAns = answers[String(q.id)] !== null && answers[String(q.id)] !== undefined;
                  const isCurr = idx === currentIdx;
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => {
                        setCurrentIdx(idx);
                        setShowGridSheet(false);
                      }}
                      className={cn(
                        'h-10 rounded-xl text-xs font-extrabold border transition flex items-center justify-center',
                        isCurr
                          ? 'bg-neb-600 border-neb-400 text-white'
                          : isAns
                            ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-300'
                            : 'bg-dark-950 border-dark-800 text-gray-400'
                      )}
                    >
                      {q.order || idx + 1}
                    </button>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-dark-800 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setShowGridSheet(false)}
                  className="flex-1 py-2.5 rounded-xl bg-dark-800 text-gray-300 text-xs font-bold"
                >
                  Continue Test
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowGridSheet(false);
                    setShowSubmitConfirm(true);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-neb-600 hover:bg-neb-500 text-white text-xs font-extrabold"
                >
                  Submit Paper
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Submit Confirmation Modal (Inside Fullscreen Container) */}
        {showSubmitConfirm && (
          <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-dark-900 border border-dark-700 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
              <CheckCircle2 className="h-12 w-12 text-neb-400 mx-auto" />
              <h3 className="text-lg font-extrabold text-white">Submit Your Paper?</h3>
              <p className="text-xs text-gray-300 leading-relaxed">
                You have answered <strong className="text-white">{answeredCount}</strong> out of{' '}
                <strong className="text-white">{questions.length}</strong> questions.
                {questions.length - answeredCount > 0 && (
                  <span className="block text-amber-400 mt-1 font-semibold">
                    Warning: {questions.length - answeredCount} question(s) are still unanswered!
                  </span>
                )}
              </p>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSubmitConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl bg-dark-800 hover:bg-dark-700 text-gray-300 text-xs font-bold border border-dark-700"
                >
                  Review More
                </button>
                <Button
                  onClick={() => submitExamNow({ autoSubmitted: false, reason: 'manual' })}
                  isLoading={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-neb-600 hover:bg-neb-500 text-xs font-extrabold"
                >
                  Submit Now
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* In-Container Image Lightbox (Doesn't break Fullscreen Lock) */}
        {zoomedImage && (
          <div
            onClick={() => setZoomedImage(null)}
            className="fixed inset-0 z-[10001] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4"
          >
            <button
              type="button"
              onClick={() => setZoomedImage(null)}
              className="absolute top-4 right-4 p-2.5 rounded-full bg-dark-800 text-white hover:bg-dark-700"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={zoomedImage}
              alt="Zoomed"
              className="max-w-full max-h-[85vh] object-contain rounded-xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </div>
    );
  }

  // ─── PHASE 3: RESULTS & FULL 50-QUESTION EXPLANATION REVIEW ──────────────────
  if (phase === 'result' && result) {
    const reviewQuestions: any[] = result.questions || [];
    const filteredReview = reviewQuestions.filter((q) => {
      if (reviewFilter === 'correct') return q.is_correct;
      if (reviewFilter === 'incorrect') return q.selected_option_index !== null && !q.is_correct;
      if (reviewFilter === 'unanswered') return q.selected_option_index === null;
      return true;
    });

    const isPass = (result.percentage || 0) >= 50;

    return (
      <div className="max-w-4xl mx-auto px-4 py-6 md:py-10 pb-28 space-y-6 animate-in fade-in duration-300">
        {/* Top Navigation */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Link
            href="/mcq"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-white transition"
          >
            <ArrowLeft className="h-4 w-4" /> Back to All MCQ Papers
          </Link>
          <Button
            onClick={() => {
              setResult(null);
              setPhase('intro');
            }}
            size="sm"
            className="bg-neb-600 hover:bg-neb-500 text-xs font-bold gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Retake This Paper
          </Button>
        </div>

        {/* Auto-Submit Notice Banner (if triggered by leaving fullscreen / switching apps or timer) */}
        {result.auto_submitted && (
          <div className="rounded-2xl bg-amber-950/35 border border-amber-700/50 p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <p className="font-extrabold text-amber-300">
                {result.submission_reason === 'timer_expired'
                  ? 'Time Expired — Automatically Submitted'
                  : 'Security Lock Triggered — Automatically Submitted'}
              </p>
              <p className="text-gray-300 mt-0.5">
                {result.submission_reason === 'timer_expired'
                  ? 'The test duration ended, so your selected answers were automatically submitted and graded.'
                  : 'We detected that you exited full-screen mode or switched to another application/tab, so your test was immediately submitted.'}
              </p>
            </div>
          </div>
        )}

        {/* Total Score Summary Card */}
        <div className="rounded-3xl bg-gradient-to-br from-dark-900 via-dark-900 to-neb-950/40 border border-dark-800 p-6 sm:p-8 shadow-2xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-dark-950 border border-dark-800 text-xs font-bold text-neb-400">
                <Calendar className="h-3.5 w-3.5" /> {result.paper_year} • {result.paper_name}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center justify-center md:justify-start gap-2">
                {isPass ? (
                  <>
                    <Trophy className="h-7 w-7 text-yellow-400" /> Great Effort!
                  </>
                ) : (
                  <>Keep Practicing!</>
                )}
              </h1>
              <p className="text-xs sm:text-sm text-gray-400">
                Completed in <strong className="text-gray-200">{formatTimeTaken(result.time_taken_seconds)}</strong> • Review every question, your ticked option, the correct answer, and full explanation below.
              </p>
            </div>

            {/* Big Score Circle */}
            <div
              className={cn(
                'w-36 h-36 rounded-3xl border-2 flex flex-col items-center justify-center shrink-0 shadow-2xl',
                isPass
                  ? 'bg-emerald-950/30 border-emerald-500/60 text-emerald-300'
                  : 'bg-red-950/30 border-red-500/60 text-red-300'
              )}
            >
              <span className="text-3xl font-black text-white">
                {result.score} <span className="text-lg font-bold text-gray-400">/ {result.total_questions}</span>
              </span>
              <span className="text-sm font-extrabold mt-1">{result.percentage}%</span>
              <span className="text-[10px] uppercase tracking-wider text-gray-400 mt-0.5">Total Score</span>
            </div>
          </div>

          {/* Breakdown Stats */}
          <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-dark-800">
            <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-800/30 text-center">
              <p className="text-lg sm:text-xl font-extrabold text-emerald-400">{result.correct_count}</p>
              <p className="text-[11px] text-gray-400 font-semibold">Correct</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-red-950/20 border border-red-800/30 text-center">
              <p className="text-lg sm:text-xl font-extrabold text-red-400">{result.incorrect_count}</p>
              <p className="text-[11px] text-gray-400 font-semibold">Incorrect</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-dark-950 border border-dark-800 text-center">
              <p className="text-lg sm:text-xl font-extrabold text-gray-300">{result.unanswered_count}</p>
              <p className="text-[11px] text-gray-400 font-semibold">Unanswered</p>
            </div>
          </div>
        </div>

        {/* Filter Tabs & Quick Question Jump Bar */}
        <div className="bg-dark-900 border border-dark-800 rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h2 className="text-sm sm:text-base font-extrabold text-white">
              Question-by-Question Review &amp; Explanations
            </h2>
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
              {[
                { key: 'all', label: `All (${reviewQuestions.length})` },
                { key: 'correct', label: `Correct (${result.correct_count})` },
                { key: 'incorrect', label: `Wrong (${result.incorrect_count})` },
                { key: 'unanswered', label: `Skipped (${result.unanswered_count})` },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setReviewFilter(tab.key as any)}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap',
                    reviewFilter === tab.key
                      ? 'bg-neb-600 text-white shadow'
                      : 'bg-dark-950 text-gray-400 hover:text-white border border-dark-800'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Color-coded 1..50 Jump Strip */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pt-1">
            {reviewQuestions.map((q) => {
              const skipped = q.selected_option_index === null;
              return (
                <a
                  key={q.id}
                  href={`#review-q-${q.order}`}
                  className={cn(
                    'w-8 h-8 rounded-lg text-xs font-extrabold flex items-center justify-center shrink-0 border transition',
                    skipped
                      ? 'bg-dark-950 border-dark-700 text-gray-400'
                      : q.is_correct
                        ? 'bg-emerald-950/60 border-emerald-600/60 text-emerald-300'
                        : 'bg-red-950/60 border-red-600/60 text-red-300'
                  )}
                >
                  {q.order}
                </a>
              );
            })}
          </div>
        </div>

        {/* All Questions Detailed Cards */}
        <div className="space-y-5">
          {filteredReview.map((q) => {
            const userChoice = q.selected_option_index;
            const correctChoice = q.correct_option_index;
            const isSkipped = userChoice === null || userChoice === undefined;
            const correctLetter = ['A', 'B', 'C', 'D'][correctChoice] || 'A';

            return (
              <div
                key={q.id}
                id={`review-q-${q.order}`}
                className="bg-dark-900 border border-dark-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-lg scroll-mt-20"
              >
                {/* Question Header */}
                <div className="flex items-center justify-between gap-2 border-b border-dark-800 pb-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-lg bg-dark-950 border border-dark-700 text-white text-xs font-extrabold">
                      Question {q.order}
                    </span>
                    {isSkipped ? (
                      <span className="px-2.5 py-1 rounded-lg bg-gray-800/80 text-gray-300 text-xs font-bold">
                        ○ Not Answered
                      </span>
                    ) : q.is_correct ? (
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-700/50 text-emerald-300 text-xs font-bold flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Correct (+1)
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg bg-red-950/80 border border-red-700/50 text-red-300 text-xs font-bold flex items-center gap-1">
                        <XCircle className="h-3.5 w-3.5" /> Incorrect (0)
                      </span>
                    )}
                  </div>

                  <span className="text-xs text-gray-400">
                    Correct Option: <strong className="text-emerald-400">{correctLetter}</strong>
                  </span>
                </div>

                {/* Question Text & Image */}
                <div className="space-y-3">
                  <div className="text-sm sm:text-base text-white leading-relaxed">
                    <KatexRenderer content={q.text} />
                  </div>
                  {q.image && (
                    <div className="p-2 bg-dark-950 border border-dark-800 rounded-xl inline-block">
                      <img
                        src={q.image}
                        alt={`Question ${q.order}`}
                        onClick={() => setZoomedImage(q.image)}
                        className="max-h-64 w-auto object-contain rounded-lg cursor-zoom-in"
                      />
                    </div>
                  )}
                </div>

                {/* All 4 Options with User's Ticked Option & Correct Option Clearly Marked */}
                <div className="grid grid-cols-1 gap-2.5">
                  {(q.options || []).slice(0, 4).map((optText: string, optIdx: number) => {
                    const letter = ['A', 'B', 'C', 'D'][optIdx];
                    const isUserTicked = userChoice === optIdx;
                    const isCorrectOpt = correctChoice === optIdx;
                    const optImg = (q.option_images || [])[optIdx] || null;

                    return (
                      <div
                        key={optIdx}
                        className={cn(
                          'p-3.5 sm:p-4 rounded-2xl border flex flex-col gap-2.5 transition',
                          isCorrectOpt
                            ? 'bg-emerald-950/30 border-emerald-500/70 shadow-md shadow-emerald-950/20'
                            : isUserTicked && !isCorrectOpt
                              ? 'bg-red-950/30 border-red-500/70'
                              : 'bg-dark-950/70 border-dark-800/90 opacity-85'
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <span
                              className={cn(
                                'w-7 h-7 rounded-xl text-xs font-extrabold flex items-center justify-center shrink-0 mt-0.5',
                                isCorrectOpt
                                  ? 'bg-emerald-600 text-white'
                                  : isUserTicked
                                    ? 'bg-red-600 text-white'
                                    : 'bg-dark-800 text-gray-400'
                              )}
                            >
                              {letter}
                            </span>
                            <div className="text-xs sm:text-sm text-gray-100 flex-1 min-w-0 pt-0.5">
                              <KatexRenderer content={optText} inline />
                            </div>
                          </div>

                          {/* Badges showing Your Choice vs Correct Option */}
                          <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                            {isUserTicked && isCorrectOpt && (
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" /> Your Answer (Correct)
                              </span>
                            )}
                            {isUserTicked && !isCorrectOpt && (
                              <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-extrabold flex items-center gap-1">
                                <XCircle className="h-3 w-3" /> Your Choice
                              </span>
                            )}
                            {!isUserTicked && isCorrectOpt && (
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-600/90 text-white text-[10px] font-extrabold flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" /> Correct Answer
                              </span>
                            )}
                          </div>
                        </div>

                        {optImg && (
                          <div className="pl-10">
                            <img
                              src={optImg}
                              alt={`Option ${letter}`}
                              onClick={() => setZoomedImage(optImg)}
                              className="max-h-44 w-auto object-contain rounded-xl border border-dark-800 bg-dark-900 p-1 cursor-zoom-in"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation Box */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/25 via-dark-950 to-dark-950 border border-amber-800/40 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-amber-400 text-xs font-extrabold uppercase tracking-wider">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Why Option {correctLetter} is Correct — Explanation</span>
                  </div>
                  <div className="text-xs sm:text-sm text-gray-200 leading-relaxed">
                    {q.explanation ? (
                      <KatexRenderer content={q.explanation} />
                    ) : (
                      <p className="text-gray-400 italic">Option {correctLetter} is the verified correct answer for this question.</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Zoom Image Modal in Results */}
        {zoomedImage && (
          <div
            onClick={() => setZoomedImage(null)}
            className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          >
            <button
              type="button"
              onClick={() => setZoomedImage(null)}
              className="absolute top-4 right-4 p-2.5 rounded-full bg-dark-800 text-white hover:bg-dark-700"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={zoomedImage}
              alt="Zoomed"
              className="max-w-full max-h-[85vh] object-contain rounded-xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </div>
    );
  }

  return null;
}

export default function MCQPaperTestPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[calc(100vh-56px)]">
          <Spinner className="h-8 w-8" />
        </div>
      }
    >
      <MCQTestContent />
    </Suspense>
  );
}
