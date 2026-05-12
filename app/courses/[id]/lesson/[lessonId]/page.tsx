'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';
import { courseService, progressService } from '@/services';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { CheckCircle, Code2, Database, ArrowLeft, ArrowRight, Youtube } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

function YouTubeEmbed({ url }: { url: string }) {
  const videoId = url?.match(/(?:v=|youtu\.be\/|embed\/)([^&?/]+)/)?.[1];
  if (!videoId) return <a href={url} target="_blank" className="text-neb-400 underline">{url}</a>;
  return (
    <div className="relative w-full rounded-xl overflow-hidden shadow-2xl my-6" style={{ paddingBottom: '56.25%' }}>
      <iframe
        className="absolute inset-0 w-full h-full"
        src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="Lesson Video"
      />
    </div>
  );
}

export default function LessonPage() {
  const { id: courseId, lessonId } = useParams<{ id: string; lessonId: string }>();
  const router = useRouter();
  const [lesson, setLesson] = useState<any>(null);
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [activeTab, setActiveTab] = useState<'lesson' | 'exercise'>('lesson');

  useEffect(() => {
    Promise.all([
      courseService.getLesson(lessonId),
      courseService.getCourse(courseId),
    ]).then(([lRes, cRes]) => {
      setLesson(lRes.data);
      setCourse(cRes.data);
    }).catch(() => toast.error('Failed to load lesson'))
    .finally(() => setLoading(false));
  }, [lessonId, courseId]);

  // Find prev/next lesson for navigation
  const allLessons = course?.modules?.flatMap((m: any) => m.lessons) || [];
  const currentIndex = allLessons.findIndex((l: any) => l.id === lessonId);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await progressService.markComplete(lessonId);
      setCompleted(true);
      toast.success('Lesson completed! 🎉');
      if (nextLesson) {
        setTimeout(() => router.push(`/courses/${courseId}/lesson/${nextLesson.id}`), 1000);
      } else {
        toast('All lessons done! Check if you can take the final exam.', { icon: '🏆' });
        setTimeout(() => router.push(`/courses/${courseId}`), 1500);
      }
    } catch { toast.error('Failed to mark complete'); }
    finally { setCompleting(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-[calc(100vh-56px)]"><Spinner className="h-8 w-8" /></div>;
  if (!lesson) return <div className="flex items-center justify-center h-[calc(100vh-56px)] text-gray-500">Lesson not found.</div>;

  const hasExercise = lesson.exercises?.length > 0;

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] overflow-hidden">
      {/* Top Bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-dark-900 border-b border-dark-700 flex-shrink-0">
        <Link href={`/courses/${courseId}`} className="text-gray-500 hover:text-white transition">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-600 truncate">{course?.title}</p>
          <h2 className="font-semibold text-sm truncate">{lesson.title}</h2>
        </div>
        {hasExercise && (
          <div className="flex rounded-lg overflow-hidden border border-dark-600 text-xs">
            <button
              onClick={() => setActiveTab('lesson')}
              className={cn("px-3 py-1.5 transition", activeTab === 'lesson' ? 'bg-neb-800 text-white' : 'text-gray-500 hover:bg-dark-700')}
            >Lesson</button>
            <button
              onClick={() => setActiveTab('exercise')}
              className={cn("px-3 py-1.5 transition", activeTab === 'exercise' ? 'bg-neb-800 text-white' : 'text-gray-500 hover:bg-dark-700')}
            >Exercise</button>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'lesson' && (
          <div className="max-w-3xl mx-auto px-4 py-8 pb-32 md:pb-12">
            {/* YouTube video if present */}
            {lesson.video_url && <YouTubeEmbed url={lesson.video_url} />}

            {/* Lesson content (Markdown + KaTeX) */}
            {lesson.content && (
              <div className="prose prose-invert prose-sm max-w-none leading-relaxed
                prose-headings:text-white prose-code:text-neb-300 prose-code:bg-dark-800 prose-code:rounded prose-code:px-1
                prose-pre:bg-dark-800 prose-pre:rounded-xl prose-pre:border prose-pre:border-dark-700
                prose-blockquote:border-l-neb-600 prose-blockquote:text-gray-400
                prose-a:text-neb-400 prose-a:no-underline hover:prose-a:underline">
                <ReactMarkdown
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[rehypeKatex, rehypeRaw as any]}
                >
                  {lesson.content}
                </ReactMarkdown>
              </div>
            )}

            {/* Navigation + Complete */}
            <div className="mt-12 flex flex-col sm:flex-row gap-3 justify-between items-center">
              <div className="flex gap-2">
                {prevLesson && (
                  <Link href={`/courses/${courseId}/lesson/${prevLesson.id}`}>
                    <Button variant="ghost" size="sm" className="gap-1.5">
                      <ArrowLeft className="h-4 w-4" /> Previous
                    </Button>
                  </Link>
                )}
              </div>
              <div className="flex gap-2">
                {hasExercise && (
                  <Button onClick={() => setActiveTab('exercise')} variant="secondary" size="sm" className="gap-1.5">
                    <Code2 className="h-4 w-4" /> Do Exercise
                  </Button>
                )}
                <Button
                  onClick={handleComplete}
                  isLoading={completing}
                  className={cn("gap-1.5", completed && "bg-green-700 hover:bg-green-600")}
                  size="sm"
                >
                  {completed ? <CheckCircle className="h-4 w-4" /> : null}
                  {completed ? 'Completed!' : nextLesson ? 'Complete & Next' : 'Complete Course'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'exercise' && (
          <ExercisePanel lesson={lesson} courseId={courseId} onComplete={handleComplete} />
        )}
      </div>
    </div>
  );
}

function ExercisePanel({ lesson, courseId, onComplete }: { lesson: any; courseId: string; onComplete: () => void }) {
  const [activeExercise, setActiveExercise] = useState(0);
  const ex = lesson.exercises?.[activeExercise];
  const isMySQL = ex?.exercise_type === 'mysql';

  return (
    <div className="h-full flex flex-col">
      {lesson.exercises.length > 1 && (
        <div className="flex gap-2 px-4 py-2 border-b border-dark-700 bg-dark-900">
          {lesson.exercises.map((_: any, i: number) => (
            <button
              key={i}
              onClick={() => setActiveExercise(i)}
              className={cn("px-3 py-1 rounded-lg text-xs font-medium transition", i === activeExercise ? "bg-neb-700 text-white" : "bg-dark-700 text-gray-400 hover:bg-dark-600")}
            >
              Exercise {i + 1}
            </button>
          ))}
        </div>
      )}

      {ex && (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Question Panel */}
          <div className="w-full md:w-72 flex-shrink-0 p-4 border-r border-dark-700 overflow-y-auto bg-dark-900 text-sm">
            <div className="flex items-center gap-2 mb-3">
              {isMySQL ? <Database className="h-4 w-4 text-blue-400" /> : <Code2 className="h-4 w-4 text-neb-400" />}
              <span className="text-xs font-bold uppercase text-gray-500">{isMySQL ? 'MySQL Lab' : 'C Programming'}</span>
            </div>
            <div className="prose prose-invert prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                {ex.question}
              </ReactMarkdown>
            </div>
          </div>

          {/* Lab Link */}
          <div className="flex-1 flex items-center justify-center flex-col gap-4 p-8 text-center">
            <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center", isMySQL ? "bg-blue-900/40" : "bg-neb-900/40")}>
              {isMySQL ? <Database className="h-8 w-8 text-blue-400" /> : <Code2 className="h-8 w-8 text-neb-400" />}
            </div>
            <h3 className="text-xl font-bold">Open in {isMySQL ? 'MySQL' : 'C'} Lab</h3>
            <p className="text-gray-500 text-sm max-w-xs">
              Your starter code is pre-loaded. Complete the exercise and come back to mark it done.
            </p>
            <Link
              href={isMySQL ? `/mysql-lab?exercise=${ex.id}` : `/editor?exercise=${ex.id}`}
              className="neb-btn px-6 py-3 rounded-xl font-bold flex items-center gap-2 bg-neb-800 hover:bg-neb-700 text-white transition"
            >
              {isMySQL ? <Database className="h-4 w-4" /> : <Code2 className="h-4 w-4" />}
              Go to {isMySQL ? 'MySQL Lab' : 'Code Editor'}
            </Link>
            <Button onClick={onComplete} variant="ghost" size="sm">
              <CheckCircle className="h-4 w-4 mr-1" /> Mark as Completed
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
