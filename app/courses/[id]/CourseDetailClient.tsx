'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { courseService, progressService } from '@/services';
import { useAuthStore } from '@/store/auth.store';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  Lock,
  Play,
  Zap,
  GraduationCap,
  Share2,
  Check,
  Code2,
  Database,
  ArrowRight,
  UserCheck,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface CourseDetailClientProps {
  id: string;
}

export default function CourseDetailClient({ id }: CourseDetailClientProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [course, setCourse] = useState<any>(null);
  const [progress, setProgress] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [mobileTab, setMobileTab] = useState<'curriculum' | 'overview'>('curriculum');

  useEffect(() => {
    Promise.all([
      courseService.getCourse(id),
      user ? progressService.getCourseProgress(id).catch(() => ({ data: { completed_lessons: [] } })) : Promise.resolve({ data: { completed_lessons: [] } })
    ]).then(([cRes, pRes]) => {
      setCourse(cRes.data);
      setProgress(pRes.data?.completed_lessons || []);
      if (cRes.data?.modules?.length > 0) {
        setExpandedModules([cRes.data.modules[0].id]);
      }
    }).catch(() => toast.error('Failed to load course'))
    .finally(() => setLoading(false));
  }, [id, user]);

  const totalLessons = course?.modules?.reduce((acc: number, m: any) => acc + m.lessons.length, 0) || 0;
  const completedCount = progress.length;
  const allDone = totalLessons > 0 && completedCount >= totalLessons;
  const courseIdentifier = course?.slug || course?.id || id;

  const handleShare = async () => {
    const shareUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/courses/${courseIdentifier}`
      : `https://nebcode.ngwafrank.com/courses/${courseIdentifier}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: course?.title || 'Nebcode Course',
          text: course?.description
            ? `${course.title} — ${course.description}`
            : `Check out ${course?.title} on Nebcode!`,
          url: shareUrl,
        });
        return;
      } catch (e) {
        // Fallback to clipboard if share was dismissed or unsupported
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Course share link copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      toast.error('Failed to copy link');
    }
  };

  const handleLessonClick = (e: React.MouseEvent, lesson: any) => {
    if (!user) {
      e.preventDefault();
      toast('Please log in or register to take this course', { icon: '🔒' });
      const targetUrl = `/courses/${courseIdentifier}/lesson/${lesson.id}`;
      router.push(`/auth/login?redirect=${encodeURIComponent(targetUrl)}`);
      return;
    }
    if (course.locked) {
      e.preventDefault();
      toast.error('This course requires a subscription to access');
    }
  };

  const handleStartLearning = () => {
    const firstLesson = course?.modules?.[0]?.lessons?.[0];
    if (!firstLesson) {
      toast.error('This course does not have any lessons available yet.');
      return;
    }

    if (!user) {
      toast('Please log in or register to take this course', { icon: '🔒' });
      const targetUrl = `/courses/${courseIdentifier}/lesson/${firstLesson.id}`;
      router.push(`/auth/login?redirect=${encodeURIComponent(targetUrl)}`);
      return;
    }

    if (course.locked) {
      router.push('/pricing');
      return;
    }

    // Find first uncompleted lesson or first lesson
    let targetLesson = firstLesson;
    for (const mod of course.modules || []) {
      for (const les of mod.lessons || []) {
        if (!progress.includes(les.id)) {
          targetLesson = les;
          break;
        }
      }
      if (!progress.includes(targetLesson.id)) break;
    }
    router.push(`/courses/${courseIdentifier}/lesson/${targetLesson.id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-56px)] bg-[#0a0a12]">
        <Spinner className="h-8 w-8 text-neb-500" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-56px)] bg-[#0a0a12] text-gray-500">
        Course not found.
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-56px)] bg-[#08080f] text-white">
      {/* Mobile Top Segment Switcher (Curriculum vs Overview) */}
      <div className="md:hidden flex items-center p-2 bg-dark-900 border-b border-dark-800 sticky top-0 z-20 shadow-md">
        <button
          onClick={() => setMobileTab('curriculum')}
          className={cn(
            "flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition",
            mobileTab === 'curriculum'
              ? "bg-neb-600 text-white shadow-md"
              : "text-gray-400 hover:text-white"
          )}
        >
          <BookOpen className="h-3.5 w-3.5" />
          <span>Curriculum ({course.modules?.length || 0} Modules)</span>
        </button>
        <button
          onClick={() => setMobileTab('overview')}
          className={cn(
            "flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition",
            mobileTab === 'overview'
              ? "bg-neb-600 text-white shadow-md"
              : "text-gray-400 hover:text-white"
          )}
        >
          <Info className="h-3.5 w-3.5" />
          <span>About Course</span>
        </button>
      </div>

      {/* Main Container */}
      <div className="flex flex-col md:flex-row flex-1 md:h-[calc(100vh-56px)] md:overflow-hidden">
        
        {/* Sidebar – Curriculum & Module Accordion */}
        <aside
          className={cn(
            "w-full md:w-84 lg:w-96 flex-shrink-0 bg-dark-900/60 border-r border-dark-800 flex flex-col md:overflow-y-auto pb-32 md:pb-0",
            mobileTab !== 'curriculum' && "hidden md:flex"
          )}
        >
          <div className="p-5 border-b border-dark-800 bg-dark-950/40">
            {/* Course Thumbnail in Sidebar */}
            {course.thumbnail && (
              <div className="relative w-full h-36 rounded-xl overflow-hidden mb-3.5 border border-dark-700/80 bg-dark-950 shadow-md group">
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-950/70 via-transparent to-transparent" />
              </div>
            )}

            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-dark-900 text-neb-400 border border-dark-800">
                {course.category || 'Programming'}
              </span>
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-gray-300 hover:text-white bg-dark-800 hover:bg-dark-700 border border-dark-700 rounded-lg transition active:scale-95"
                title="Share this course"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Share2 className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copied' : 'Share'}</span>
              </button>
            </div>

            <h1 className="font-extrabold text-lg leading-tight text-white">{course.title}</h1>
            <p className="text-gray-400 text-xs mt-1.5 line-clamp-2 leading-relaxed">{course.description}</p>
            
            <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
              <BookOpen className="h-3.5 w-3.5 text-neb-400" />
              <span>{course.modules?.length || 0} modules · {totalLessons} lessons</span>
            </div>

            {/* Logged in progress bar */}
            {user && totalLessons > 0 && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-400 mb-1 font-mono">
                  <span>Progress</span>
                  <span className="text-neb-400 font-bold">{completedCount}/{totalLessons} ({Math.round((completedCount / totalLessons) * 100)}%)</span>
                </div>
                <div className="h-1.5 bg-dark-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-neb-600 to-neb-400 rounded-full transition-all duration-500"
                    style={{ width: `${(completedCount / totalLessons) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Unauthenticated guest callout */}
            {!user && (
              <div className="mt-4 rounded-xl border border-neb-900/60 bg-neb-950/40 p-3.5 text-xs text-gray-300">
                <p className="font-semibold text-white mb-1 flex items-center gap-1.5">
                  <UserCheck className="h-4 w-4 text-neb-400" /> Free Student Preview
                </p>
                <p className="text-gray-400 mb-3 text-[11px] leading-relaxed">
                  Log in or create a free account to track your progress and run code in our live sandbox.
                </p>
                <Link
                  href={`/auth/login?redirect=${encodeURIComponent(`/courses/${courseIdentifier}`)}`}
                  className="block text-center w-full py-2 bg-neb-600 hover:bg-neb-500 text-white font-bold rounded-lg transition"
                >
                  Log In to Start Learning
                </Link>
              </div>
            )}

            {/* Locked Premium Banner for logged in users */}
            {user && course.locked && (
              <div className="mt-4 rounded-xl border border-neb-800/40 bg-gradient-to-br from-neb-950/50 to-dark-950 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-neb-900/60 flex items-center justify-center shrink-0">
                    <Zap className="h-3.5 w-3.5 text-neb-400" />
                  </div>
                  <p className="text-sm font-bold text-white">Premium Course</p>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed mb-3">
                  Subscribe once a year to unlock <strong className="text-white">all courses</strong>, the MySQL Lab, and the C Editor.
                </p>
                <Link href="/pricing" className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-lg bg-neb-600 hover:bg-neb-500 text-white text-xs font-bold transition-all active:scale-95">
                  <Zap className="h-3.5 w-3.5" /> Subscribe — View Plans
                </Link>
              </div>
            )}

            {user && !course.locked && allDone && course.exam && (
              <Link href={`/courses/${courseIdentifier}/exam`}>
                <Button className="w-full mt-4 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white" variant="primary">
                  Take Final Exam <GraduationCap className="h-4 w-4" />
                </Button>
              </Link>
            )}

          </div>

          {/* Module List — Smooth natural scrolling on mobile, isolated scroll on desktop */}
          <div className="divide-y divide-dark-800 md:flex-1 md:overflow-y-auto">
            {course.modules?.map((mod: any, mi: number) => {
              const isExpanded = expandedModules.includes(mod.id);
              const modCompleted = mod.lessons.filter((l: any) => progress.includes(l.id)).length;
              return (
                <div key={mod.id}>
                  <button
                    onClick={() => setExpandedModules(prev => isExpanded ? prev.filter(x => x !== mod.id) : [...prev, mod.id])}
                    className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-dark-800/40 text-left transition"
                  >
                    <span className="w-6 h-6 rounded-full bg-dark-800 border border-dark-700 text-xs flex items-center justify-center font-bold text-gray-300 flex-shrink-0">
                      {mi + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-xs text-gray-200 truncate">{mod.title}</p>
                      <p className="text-[11px] text-gray-500">{modCompleted}/{mod.lessons.length} lessons completed</p>
                    </div>
                    {isExpanded ? <ChevronDown className="h-4 w-4 text-gray-500" /> : <ChevronRight className="h-4 w-4 text-gray-500" />}
                  </button>

                  {isExpanded && (
                    <div className="bg-dark-950/60">
                      {mod.lessons.map((lesson: any, li: number) => {
                        const done = progress.includes(lesson.id);
                        return (
                          <Link
                            key={lesson.id}
                            href={`/courses/${courseIdentifier}/lesson/${lesson.id}`}
                            onClick={(e) => handleLessonClick(e, lesson)}
                            className={cn(
                              "flex items-center gap-3 px-5 py-3 text-xs hover:bg-dark-800/40 transition border-t border-dark-850/40",
                              user && course.locked && "opacity-50"
                            )}
                          >
                            <span className="w-5 text-[11px] text-gray-500 font-mono">{mi + 1}.{li + 1}</span>
                            {done ? (
                              <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                            ) : (user && course.locked) ? (
                              <Lock className="h-4 w-4 text-gray-500 flex-shrink-0" />
                            ) : (
                              <Play className="h-3.5 w-3.5 text-neb-400 flex-shrink-0" />
                            )}
                            <span className={cn("flex-1 truncate", done ? "text-gray-400" : "text-gray-200")}>{lesson.title}</span>
                            {lesson.has_exercise && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-dark-800 text-neb-400 border border-dark-700">Exercise</span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        {/* Main – Course Overview & Details */}
        <main
          className={cn(
            "flex-1 p-6 md:p-12 flex flex-col justify-between md:overflow-y-auto pb-32 md:pb-12",
            mobileTab !== 'overview' && "hidden md:flex"
          )}
        >
          <div className="max-w-3xl mx-auto w-full space-y-8">
            {/* Hero Header */}
            <div className="space-y-4">
              {/* Prominent Course Thumbnail in Overview */}
              {course.thumbnail && (
                <div className="relative w-full max-w-lg h-52 sm:h-64 rounded-2xl overflow-hidden border border-dark-700 shadow-2xl bg-dark-950">
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-950/70 via-transparent to-transparent" />
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-neb-950 text-neb-400 border border-neb-800/60">
                  {course.category === 'mysql' ? 'MySQL Database' : course.category === 'programming' ? 'C Programming' : 'Computer Science'}
                </span>
                {course.is_free ? (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-green-950 text-green-400 border border-green-800/60">
                    Free Course
                  </span>
                ) : (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-950 text-amber-400 border border-amber-800/60">
                    Premium Tier
                  </span>
                )}
              </div>

              <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
                {course.title}
              </h1>

              <p className="text-gray-300 text-sm md:text-base leading-relaxed">
                {course.description || 'Master hands-on programming with live browser terminals, step-by-step interactive exercises, and verified certificates.'}
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={handleStartLearning}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-neb-600 to-neb-500 hover:from-neb-500 hover:to-neb-400 text-white font-bold text-sm shadow-lg shadow-neb-900/30 flex items-center gap-2 transition active:scale-95"
                >
                  {!user ? 'Start Learning (Free)' : completedCount > 0 ? 'Continue Course' : 'Start Course'}
                  <ArrowRight className="h-4 w-4" />
                </button>

                <button
                  onClick={handleShare}
                  className="px-4 py-3 rounded-xl bg-dark-900 hover:bg-dark-800 text-gray-300 hover:text-white border border-dark-700 text-sm font-semibold flex items-center gap-2 transition active:scale-95"
                >
                  {copied ? <Check className="h-4 w-4 text-green-400" /> : <Share2 className="h-4 w-4" />}
                  {copied ? 'Link Copied!' : 'Share Course'}
                </button>
              </div>
            </div>

            {/* Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-dark-800">
              <div className="bg-dark-900/40 border border-dark-800 p-4 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-neb-950 border border-neb-800/60 flex items-center justify-center mb-2">
                  <Code2 className="h-4 w-4 text-neb-400" />
                </div>
                <h4 className="text-xs font-bold text-white mb-1">Interactive Sandbox</h4>
                <p className="text-[11px] text-gray-400">Run code in real-time right inside your browser without installing anything.</p>
              </div>

              <div className="bg-dark-900/40 border border-dark-800 p-4 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-neb-950 border border-neb-800/60 flex items-center justify-center mb-2">
                  <Database className="h-4 w-4 text-neb-400" />
                </div>
                <h4 className="text-xs font-bold text-white mb-1">Dedicated Container</h4>
                <p className="text-[11px] text-gray-400">Isolated database and environment preserved across your sessions.</p>
              </div>

              <div className="bg-dark-900/40 border border-dark-800 p-4 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-neb-950 border border-neb-800/60 flex items-center justify-center mb-2">
                  <GraduationCap className="h-4 w-4 text-neb-400" />
                </div>
                <h4 className="text-xs font-bold text-white mb-1">Verified Certificate</h4>
                <p className="text-[11px] text-gray-400">Pass the final exam and earn a verifiable Nebcode certificate.</p>
              </div>
            </div>

            {/* Syllabus Quick Overview */}
            <div className="bg-dark-900/30 border border-dark-800 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-neb-400" /> Course Curriculum Outline
              </h3>
              <div className="space-y-3">
                {course.modules?.map((m: any, idx: number) => (
                  <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-dark-950/60 border border-dark-850">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-gray-400 w-5">M{idx + 1}</span>
                      <span className="text-xs font-medium text-gray-200">{m.title}</span>
                    </div>
                    <span className="text-[11px] text-gray-400">{m.lessons?.length || 0} lessons</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer info */}
          <div className="mt-8 text-center text-xs text-gray-500">
            Shareable Link: <span className="font-mono text-gray-400 underline cursor-pointer" onClick={handleShare}>{typeof window !== 'undefined' ? `${window.location.origin}/courses/${courseIdentifier}` : `https://nebcode.ngwafrank.com/courses/${courseIdentifier}`}</span>
          </div>
        </main>
      </div>
    </div>
  );
}
