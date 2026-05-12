'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { courseService, paymentService, progressService } from '@/services';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { BookOpen, ChevronDown, ChevronRight, CheckCircle, Lock, Play, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [course, setCourse] = useState<any>(null);
  const [progress, setProgress] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [phone, setPhone] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [expandedModules, setExpandedModules] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([
      courseService.getCourse(id),
      progressService.getCourseProgress(id).catch(() => ({ data: { completed_lessons: [] } }))
    ]).then(([cRes, pRes]) => {
      setCourse(cRes.data);
      setProgress(pRes.data?.completed_lessons || []);
      // Expand first module by default
      if (cRes.data?.modules?.length > 0) {
        setExpandedModules([cRes.data.modules[0].id]);
      }
    }).catch(() => toast.error('Failed to load course'))
    .finally(() => setLoading(false));
  }, [id]);

  const totalLessons = course?.modules?.reduce((acc: number, m: any) => acc + m.lessons.length, 0) || 0;
  const completedCount = progress.length;
  const allDone = totalLessons > 0 && completedCount >= totalLessons;

  const handlePurchase = async () => {
    if (!phone.trim()) return toast.error('Enter your phone number');
    setPurchasing(true);
    try {
      const res = await paymentService.initiate(id, phone);
      if (res.data?.payment_url) window.open(res.data.payment_url, '_blank');
      toast.success('Payment initiated! Complete it in the new tab.');
      setShowPayment(false);
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Payment failed');
    } finally { setPurchasing(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-[calc(100vh-56px)]"><Spinner className="h-8 w-8" /></div>;
  if (!course) return <div className="flex items-center justify-center h-[calc(100vh-56px)] text-gray-500">Course not found.</div>;

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden">
      {/* Sidebar – Curriculum */}
      <aside className="w-full md:w-80 flex-shrink-0 bg-dark-900 border-r border-dark-700 overflow-y-auto flex flex-col">
        <div className="p-5 border-b border-dark-700">
          <h1 className="font-bold text-lg leading-tight">{course.title}</h1>
          <p className="text-gray-500 text-sm mt-1 line-clamp-2">{course.description}</p>
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-600">
            <BookOpen className="h-3.5 w-3.5" />
            <span>{course.modules?.length} modules · {totalLessons} lessons</span>
          </div>
          {totalLessons > 0 && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Progress</span>
                <span>{completedCount}/{totalLessons}</span>
              </div>
              <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
                <div className="h-full bg-neb-600 rounded-full transition-all duration-500" style={{ width: `${(completedCount / totalLessons) * 100}%` }} />
              </div>
            </div>
          )}
          {course.locked ? (
            <div className="mt-4 space-y-2">
              {showPayment ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 bg-dark-800 border border-dark-600 rounded-lg px-3 py-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <input className="flex-1 bg-transparent outline-none text-sm" placeholder="237XXXXXXXXX" value={phone} onChange={e => setPhone(e.target.value)} />
                  </div>
                  <Button onClick={handlePurchase} isLoading={purchasing} className="w-full">
                    Pay {Number(course.price).toLocaleString()} XAF via Fapshi
                  </Button>
                </div>
              ) : (
                <Button onClick={() => setShowPayment(true)} className="w-full gap-2">
                  <Lock className="h-4 w-4" /> Unlock — {Number(course.price).toLocaleString()} XAF
                </Button>
              )}
            </div>
          ) : allDone && course.exam ? (
            <Link href={`/courses/${id}/exam`}>
              <Button className="w-full mt-4" variant="secondary">Take Final Exam 🎓</Button>
            </Link>
          ) : null}
        </div>

        {/* Module List */}
        <div className="flex-1 overflow-y-auto divide-y divide-dark-800">
          {course.modules?.map((mod: any, mi: number) => {
            const isExpanded = expandedModules.includes(mod.id);
            const modCompleted = mod.lessons.filter((l: any) => progress.includes(l.id)).length;
            return (
              <div key={mod.id}>
                <button
                  onClick={() => setExpandedModules(prev => isExpanded ? prev.filter(x => x !== mod.id) : [...prev, mod.id])}
                  className="w-full flex items-center gap-3 px-5 py-4 hover:bg-dark-800/50 text-left transition"
                >
                  <span className="w-6 h-6 rounded-full bg-dark-700 text-xs flex items-center justify-center font-bold text-gray-400 flex-shrink-0">
                    {mi + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{mod.title}</p>
                    <p className="text-xs text-gray-600">{modCompleted}/{mod.lessons.length} lessons</p>
                  </div>
                  {isExpanded ? <ChevronDown className="h-4 w-4 text-gray-600" /> : <ChevronRight className="h-4 w-4 text-gray-600" />}
                </button>

                {isExpanded && (
                  <div className="bg-dark-950/50">
                    {mod.lessons.map((lesson: any, li: number) => {
                      const done = progress.includes(lesson.id);
                      return (
                        <Link
                          key={lesson.id}
                          href={course.locked ? '#' : `/courses/${id}/lesson/${lesson.id}`}
                          onClick={e => course.locked && e.preventDefault()}
                          className={cn(
                            "flex items-center gap-3 px-5 py-3 text-sm hover:bg-dark-800/50 transition border-t border-dark-800/50",
                            course.locked && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <span className="w-5 text-xs text-gray-600">{mi + 1}.{li + 1}</span>
                          {done ? (
                            <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                          ) : course.locked ? (
                            <Lock className="h-4 w-4 text-gray-600 flex-shrink-0" />
                          ) : (
                            <Play className="h-4 w-4 text-neb-500 flex-shrink-0" />
                          )}
                          <span className={cn("flex-1 truncate", done && "text-gray-500")}>{lesson.title}</span>
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

      {/* Main – Welcome / Select Lesson */}
      <main className="hidden md:flex flex-1 items-center justify-center flex-col text-center p-12">
        <BookOpen className="h-16 w-16 text-dark-600 mb-4" />
        <h2 className="text-2xl font-bold text-gray-300">Select a lesson to begin</h2>
        <p className="text-gray-600 mt-2 max-w-md">Choose any lesson from the curriculum on the left to start learning.</p>
      </main>
    </div>
  );
}
