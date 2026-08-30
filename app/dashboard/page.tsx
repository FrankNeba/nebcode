'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, CheckCircle2, TrendingUp, Terminal, Code2, ArrowRight, Star, Zap, ShieldAlert, Play, Lock } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { progressService, paymentService, courseService } from '@/services';
import { cn } from '@/lib/utils';
import { Spinner } from '@/components/ui/Spinner';

interface EnrolledCourse {
  id: string;
  title: string;
  description: string;
  thumbnail: string | null;
  category: string;
  module_count: number;
  is_free: boolean;
  locked: boolean;
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [purchases, setPurchases] = useState<any[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [courseProgressMap, setCourseProgressMap] = useState<Record<string, { completed: number; total: number }>>({});
  const [loading, setLoading] = useState(true);

  const isSubscribed = user?.is_subscribed || user?.is_staff;
  const currentMonthPrefix = new Date().toISOString().slice(0, 7);
  const labDays: string[] = user?.lab_access_days || [];
  const daysUsedThisMonth = labDays.filter((d: string) => d.startsWith(currentMonthPrefix)).length;
  const freeLimit = 3;
  const daysLeft = Math.max(0, freeLimit - daysUsedThisMonth);

  useEffect(() => {
    async function load() {
      try {
        // Fetch all courses and purchases in parallel
        const [{ data: purchasesData }, { data: allCoursesData }, { data: progressData }] = await Promise.all([
          paymentService.getMyPurchases(),
          courseService.getCourses(),
          progressService.getMyProgress(),
        ]);

        const purchaseList = purchasesData || [];
        setPurchases(purchaseList);

        const allCourses: EnrolledCourse[] = allCoursesData?.results || allCoursesData || [];
        const purchasedCourseIds = new Set(purchaseList.map((p: any) => p.course_id || p.course));

        // Filter to courses the user is enrolled in: free courses + purchased ones
        // Include courses where user has made any progress (started but not purchased)
        const completedLessons: any[] = progressData || [];
        const coursesWithProgress = new Set(completedLessons.map((p: any) => String(p.course_id)));

        const enrolled = allCourses.filter(
          (c) => c.is_free || purchasedCourseIds.has(c.id) || isSubscribed || coursesWithProgress.has(c.id)
        );
        setEnrolledCourses(enrolled);

        // Build a progress map: courseId -> { completed, total }
        // We only have completed count from getMyProgress — group by course_id
        const progressByCourse: Record<string, number> = {};
        completedLessons.forEach((p: any) => {
          const cId = String(p.course_id);
          progressByCourse[cId] = (progressByCourse[cId] || 0) + 1;
        });

        // For total lessons per course, use module_count as an approximation
        // or fetch individual course progress for enrolled ones
        const progressMap: Record<string, { completed: number; total: number }> = {};
        enrolled.forEach((course) => {
          progressMap[course.id] = {
            completed: progressByCourse[course.id] || 0,
            total: 0, // we'll fill in from course detail if needed
          };
        });
        setCourseProgressMap(progressMap);
      } catch (e) {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [isSubscribed]);

  const completedCourses = enrolledCourses.filter(
    (c) => (courseProgressMap[c.id]?.completed || 0) > 0 && courseProgressMap[c.id]?.completed === courseProgressMap[c.id]?.total && courseProgressMap[c.id]?.total > 0
  ).length;

  const inProgressCourses = enrolledCourses.filter(
    (c) => (courseProgressMap[c.id]?.completed || 0) > 0
  ).length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 pb-32 md:pb-10">
      <div className="mb-8">
        <h1 className="font-bold text-2xl text-white">Hey, {user?.full_name?.split(' ')[0] || 'learner'} 👋</h1>
        <p className="text-gray-500 text-sm mt-1">Keep up the momentum!</p>
      </div>

      {/* Admin Quick Link */}
      {user?.is_staff && (
        <div className="mb-6 rounded-2xl border border-red-800/40 bg-gradient-to-br from-red-950/60 via-dark-900/80 to-dark-950 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-red-900/20 border border-red-800/30 flex items-center justify-center shrink-0">
            <ShieldAlert className="h-5 w-5 text-red-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm">Administrative Controls</p>
            <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">
              You have staff access. Manage user accounts, upload course structure JSONs, and perform platform-wide operations.
            </p>
          </div>
          <Link
            href="/dashboard/admin"
            className="shrink-0 px-4 py-2 rounded-xl bg-red-900/80 hover:bg-red-850 text-white text-xs font-bold shadow-lg transition-all active:scale-95 flex items-center gap-1.5"
          >
            Access Admin Panel <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* Premium Upgrade Banner — only for free-tier users */}
      {!isSubscribed && (
        <div className="mb-6 rounded-2xl border border-neb-800/40 bg-gradient-to-br from-neb-950/60 via-dark-900/80 to-dark-950 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-neb-900/60 border border-neb-700/30 flex items-center justify-center shrink-0">
            <Zap className="h-5 w-5 text-neb-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm">Upgrade to Premium</p>
            <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">
              {daysLeft > 0
                ? <><strong className="text-amber-400">{daysLeft} free lab day{daysLeft !== 1 ? 's' : ''}</strong> remaining this month. Get unlimited C Editor &amp; MySQL Lab access with a subscription.</>
                : <><strong className="text-red-400">3 free lab days</strong> for this month are used up. Subscribe to continue coding without interruption.</>
              }
            </p>
          </div>
          <Link
            href="/pricing"
            className="shrink-0 px-4 py-2 rounded-xl bg-neb-600 hover:bg-neb-500 text-white text-xs font-bold shadow-lg shadow-neb-950/20 transition-all active:scale-95 flex items-center gap-1.5"
          >
            <Star className="h-3.5 w-3.5" /> Go Premium
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { icon: BookOpen, label: 'Enrolled', value: enrolledCourses.length, color: 'text-neb-400' },
          { icon: TrendingUp, label: 'In Progress', value: inProgressCourses, color: 'text-amber-400' },
          { icon: CheckCircle2, label: 'Completed', value: completedCourses, color: 'text-emerald-400' },
          ...(!isSubscribed ? [{ icon: Star, label: 'Lab Days Left', value: daysLeft, color: daysLeft > 0 ? 'text-amber-400' : 'text-red-400' }] : []),
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="card p-4 flex flex-col gap-2">
            <Icon className={`h-4 w-4 ${color}`} />
            <p className="text-2xl font-bold text-white">{loading ? '—' : value}</p>
            <p className="text-xs text-gray-600">{label}</p>
          </div>
        ))}
      </div>

      {/* Lab shortcuts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <Link href="/editor" className="card card-hover p-5 flex items-center gap-4 group">
          <div className="w-10 h-10 rounded-lg bg-neb-900/50 border border-neb-800/40 flex items-center justify-center shrink-0 group-hover:bg-neb-900 transition-colors">
            <Code2 className="h-5 w-5 text-neb-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white text-sm">C Editor</p>
            <p className="text-xs text-gray-500">Write and run C programs</p>
          </div>
          {!isSubscribed && (
            <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0", daysLeft > 0 ? "bg-amber-950/40 text-amber-400" : "bg-red-950/40 text-red-400")}>
              {daysLeft > 0 ? `${daysLeft}d left` : 'Limit reached'}
            </span>
          )}
          <ArrowRight className="h-4 w-4 text-gray-600 group-hover:text-neb-400 transition-colors shrink-0" />
        </Link>

        <Link href="/mysql-lab" className="card card-hover p-5 flex items-center gap-4 group">
          <div className="w-10 h-10 rounded-lg bg-emerald-900/30 border border-emerald-800/30 flex items-center justify-center shrink-0 group-hover:bg-emerald-900/50 transition-colors">
            <Terminal className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white text-sm">MySQL Lab</p>
            <p className="text-xs text-gray-500">Live MySQL terminal</p>
          </div>
          {!isSubscribed && (
            <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0", daysLeft > 0 ? "bg-amber-950/40 text-amber-400" : "bg-red-950/40 text-red-400")}>
              {daysLeft > 0 ? `${daysLeft}d left` : 'Limit reached'}
            </span>
          )}
          <ArrowRight className="h-4 w-4 text-gray-600 group-hover:text-emerald-400 transition-colors shrink-0" />
        </Link>
      </div>

      {/* Enrolled Courses Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg text-white">My Courses</h2>
          <Link href="/courses" className="text-xs text-neb-400 hover:text-neb-300 font-medium flex items-center gap-1 transition-colors">
            Browse all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner className="h-8 w-8" />
          </div>
        ) : enrolledCourses.length === 0 ? (
          <div className="card p-8 text-center">
            <BookOpen className="h-10 w-10 text-dark-500 mx-auto mb-3" />
            <p className="text-gray-500 text-sm mb-4">No enrolled courses yet. Start learning!</p>
            <Link href="/courses" className="inline-flex items-center gap-1.5 text-sm text-neb-400 hover:text-neb-300 font-medium">
              Browse courses <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {enrolledCourses.map((course) => {
              const prog = courseProgressMap[course.id];
              const completed = prog?.completed || 0;
              const hasProgress = completed > 0;

              return (
                <Link key={course.id} href={`/courses/${course.id}`}>
                  <div className="card card-hover p-4 flex gap-4 items-start group transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-neb-900/10">
                    {/* Thumbnail / Icon */}
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-dark-800 to-dark-950 flex items-center justify-center shrink-0 overflow-hidden border border-dark-700">
                      {course.thumbnail ? (
                        <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                      ) : (
                        <BookOpen className="h-6 w-6 text-neb-500/60" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-sm text-white group-hover:text-neb-400 transition-colors line-clamp-1">{course.title}</h3>
                        {hasProgress ? (
                          <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-950/40 text-amber-400 border border-amber-900/30">
                            In Progress
                          </span>
                        ) : (
                          <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-dark-800 text-gray-500 border border-dark-700">
                            Not Started
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{course.description}</p>

                      {/* Progress bar */}
                      <div className="mt-2.5 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-dark-800 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-700",
                              hasProgress ? "bg-neb-500" : "bg-dark-700"
                            )}
                            style={{ width: hasProgress ? `${Math.min(100, completed * 10)}%` : '0%' }}
                          />
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {hasProgress ? (
                            <Play className="h-3 w-3 text-neb-400" />
                          ) : (
                            <Play className="h-3 w-3 text-gray-600" />
                          )}
                          <span className="text-[10px] text-gray-500 font-mono">
                            {completed} done
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
