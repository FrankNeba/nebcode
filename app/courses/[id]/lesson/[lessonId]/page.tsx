'use client';
import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';
import { courseService, progressService, executionService } from '@/services';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { CheckCircle, Code2, Database, ArrowLeft, ArrowRight, Terminal as TerminalIcon, Play, Info, Zap, Eye, EyeOff, Lightbulb, FileText, PenLine } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn, copyToClipboard } from '@/lib/utils';
import { useEditorStore } from '@/store/editor.store';
import { useDeviceOtpStore } from '@/store/device-otp.store';

const MySQLEmbeddedTerminal = dynamic(
  () => import('@/components/courses/MySQLEmbeddedTerminal').then((m) => m.MySQLEmbeddedTerminal),
  { ssr: false }
);
const CodeEditor = dynamic(
  () => import('@/components/editor/CodeEditor').then((m) => m.CodeEditor),
  { ssr: false }
);

function YouTubeEmbed({ url }: { url: string }) {
  const videoId = url?.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([^&?/]+)/)?.[1];
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

// Custom Markdown Code Component
// Global renderers removed, now dynamically created inside LessonPage to support navigation/Try It params.

export default function LessonPage() {
  const { id: courseId, lessonId } = useParams<{ id: string; lessonId: string }>();
  const router = useRouter();
  const [lesson, setLesson] = useState<any>(null);
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [activeTab, setActiveTab] = useState<'lesson' | 'exercise'>('lesson');
  const [showTerminal, setShowTerminal] = useState(false);

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

  const allLessons = course?.modules?.flatMap((m: any) => m.lessons) || [];
  const currentIndex = allLessons.findIndex((l: any) => l.id === lessonId);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await progressService.markComplete(lessonId);
      setCompleted(true);
      toast.success('Lesson completed!');
      if (nextLesson) {
        setTimeout(() => router.push(`/courses/${courseId}/lesson/${nextLesson.id}`), 1000);
      } else {
        toast('All lessons done! Check if you can take the final exam.');
        setTimeout(() => router.push(`/courses/${courseId}`), 1500);
      }
    } catch { toast.error('Failed to mark complete'); }
    finally { setCompleting(false); }
  };

  const handleDoExercise = () => {
    const ex = lesson?.exercises?.[0];
    if (!ex) return;
    setActiveTab('exercise');
  };

  const isMySQLCourse = course?.category === 'mysql';

  const renderers = useMemo(() => ({
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      const lang = match ? match[1] : '';
      if (!inline && lang) {
        const codeString = String(children).replace(/\n$/, '');
        return (
          <div className="my-5 rounded-xl border border-dark-800 bg-[#06060c] overflow-hidden shadow-2xl">
            <div className="px-4 py-2 bg-dark-900 border-b border-dark-800 flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-widest text-neb-400 font-mono flex items-center gap-1">
                {lang === 'sql' ? <><Zap className="h-3 w-3 text-amber-400" /> SQL COMMAND</> : `${lang.toUpperCase()} CODE`}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    const ok = await copyToClipboard(codeString);
                    if (ok) toast.success('Copied to clipboard!');
                    else toast.error('Failed to copy');
                  }}
                  className="text-[10px] text-gray-400 hover:text-white transition-all bg-dark-950 px-2.5 py-1 rounded border border-dark-800 font-sans font-semibold active:scale-95"
                >
                  Copy
                </button>
                <button
                  onClick={() => {
                    const targetUrl = isMySQLCourse
                      ? `/mysql-lab?courseId=${courseId}&lessonId=${lessonId}&code=${encodeURIComponent(codeString)}`
                      : `/editor?courseId=${courseId}&lessonId=${lessonId}&code=${encodeURIComponent(codeString)}`;
                    router.push(targetUrl);
                  }}
                  className="text-[10px] text-neb-400 hover:text-neb-300 font-bold transition-all bg-neb-950/40 px-2.5 py-1 rounded border border-neb-800/30 font-sans"
                >
                  Try It ▶
                </button>
              </div>
            </div>
            <pre className="p-4 overflow-x-auto text-xs md:text-sm font-mono leading-relaxed text-gray-300">
              <code>{children}</code>
            </pre>
          </div>
        );
      }
      return (
        <code className={cn("bg-dark-900 text-neb-400 rounded px-1.5 py-0.5 font-mono text-xs border border-dark-850", className)} {...props}>
          {children}
        </code>
      );
    }
  }), [isMySQLCourse, courseId, lessonId, router]);

  if (loading) return <div className="flex items-center justify-center h-[calc(100vh-56px)]"><Spinner className="h-8 w-8" /></div>;
  if (!lesson) return <div className="flex items-center justify-center h-[calc(100vh-56px)] text-gray-500">Lesson not found.</div>;

  const hasExercise = lesson?.exercises?.length > 0;

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] overflow-hidden">
      {/* Top Bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-dark-900 border-b border-dark-800 flex-shrink-0">
        <Link href={`/courses/${courseId}`} className="text-gray-500 hover:text-white transition">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase font-extrabold tracking-wider text-gray-500 truncate">{course?.title}</p>
          <h2 className="font-bold text-sm text-white truncate mt-0.5">{lesson.title}</h2>
        </div>

        {/* Toggle split-pane terminal — desktop only */}
        {isMySQLCourse && (
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setShowTerminal(!showTerminal)}
            className={cn("h-8 text-xs border border-dark-800 px-3 hidden md:flex", showTerminal ? "bg-neb-950 border-neb-700/50 text-neb-400" : "text-gray-400 hover:text-white")}
          >
            <TerminalIcon className="h-3.5 w-3.5 mr-1" />
            Terminal
          </Button>
        )}

        {hasExercise && (
          <div className="flex rounded-lg overflow-hidden border border-dark-800 text-xs">
            <button
              onClick={() => setActiveTab('lesson')}
              className={cn("px-3 py-1.5 transition font-semibold", activeTab === 'lesson' ? 'bg-neb-800 text-white' : 'text-gray-500 hover:bg-dark-800')}
            >Lesson</button>
            <button
              onClick={() => setActiveTab('exercise')}
              className={cn("px-3 py-1.5 transition font-semibold", activeTab === 'exercise' ? 'bg-neb-800 text-white' : 'text-gray-500 hover:bg-dark-800')}
            >Exercise</button>
          </div>
        )}
      </div>

      {/* Main split-screen panel */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left pane: Lesson Content / Exercises */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'lesson' && (
            <div className="max-w-3xl mx-auto px-4 py-8 pb-32 md:pb-12 animate-in fade-in duration-350">
              {lesson.video_url && <YouTubeEmbed url={lesson.video_url} />}

              {/* Primary content */}
              {lesson.content && (
                <div className="prose prose-invert prose-sm md:prose-base max-w-none leading-relaxed
                  prose-headings:text-white prose-headings:font-bold prose-headings:tracking-tight
                  prose-h1:text-2xl prose-h1:mt-8 prose-h1:mb-4
                  prose-h2:text-xl prose-h2:mt-6 prose-h2:mb-3 prose-h2:border-b prose-h2:border-dark-800 prose-h2:pb-2
                  prose-h3:text-lg prose-h3:mt-5 prose-h3:mb-2
                  prose-p:text-gray-300 prose-p:leading-[1.8]
                  prose-blockquote:border-l-neb-600 prose-blockquote:text-gray-400 prose-blockquote:bg-dark-900/50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:not-italic
                  prose-a:text-neb-400 prose-a:no-underline hover:prose-a:underline
                  prose-strong:text-white prose-strong:font-semibold
                  prose-ul:text-gray-300 prose-li:marker:text-neb-500 prose-li:leading-[1.7]
                  prose-ol:text-gray-300">
                  <ReactMarkdown
                    remarkPlugins={[remarkMath, remarkGfm]}
                    rehypePlugins={[rehypeKatex, rehypeRaw as any]}
                    components={renderers}
                  >
                    {lesson.content}
                  </ReactMarkdown>
                </div>
              )}

              {/* Sub-sections Rendering */}
              {lesson.sections && lesson.sections.length > 0 && (
                <div className="mt-8 pt-8 border-t border-dark-800 flex flex-col gap-8">
                  {lesson.sections.map((sect: any, idx: number) => (
                    <div key={sect.id || idx} className="flex flex-col gap-3">
                      <h3 className="text-xl font-bold text-white">{sect.title}</h3>
                      <div className="prose prose-invert prose-sm max-w-none leading-relaxed">
                        <ReactMarkdown
                          remarkPlugins={[remarkMath, remarkGfm]}
                          rehypePlugins={[rehypeKatex, rehypeRaw as any]}
                          components={renderers}
                        >
                          {sect.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Navigation */}
              <div className="mt-12 flex flex-col sm:flex-row gap-3 justify-between items-center pt-6 border-t border-dark-800">
                <div className="flex gap-2">
                  {prevLesson && (
                    <Link href={`/courses/${courseId}/lesson/${prevLesson.id}`}>
                      <Button variant="ghost" size="sm" className="gap-1.5 border border-dark-800">
                        <ArrowLeft className="h-4 w-4" /> Previous
                      </Button>
                    </Link>
                  )}
                </div>
                <div className="flex gap-2">
                  {hasExercise && (
                    <Button onClick={handleDoExercise} variant="secondary" size="sm" className="gap-1.5">
                      <Code2 className="h-4 w-4" /> Do Exercise
                    </Button>
                  )}
                  <Button
                    onClick={handleComplete}
                    isLoading={completing}
                    className={cn("gap-1.5 font-bold", completed && "bg-green-700 hover:bg-green-600")}
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
            <ExercisePanel
              lesson={lesson}
              courseId={courseId}
              lessonId={lessonId}
              onComplete={handleComplete}
              onOpenSplitTerminal={() => setShowTerminal(true)}
            />
          )}
        </div>

        {/* Right pane: Embedded MySQL Terminal */}
        {showTerminal && isMySQLCourse && (
          <div className="w-[380px] md:w-[480px] border-l border-dark-800 shrink-0 h-full p-2 bg-[#05050a] hidden md:block">
            <MySQLEmbeddedTerminal onClose={() => setShowTerminal(false)} />
          </div>
        )}
      </div>
    </div>
  );
}

function ExercisePanel({
  lesson,
  courseId,
  lessonId,
  onComplete,
  onOpenSplitTerminal
}: {
  lesson: any;
  courseId: string;
  lessonId: string;
  onComplete: () => void;
  onOpenSplitTerminal: () => void;
}) {
  const [activeExercise, setActiveExercise] = useState(0);
  const ex = lesson.exercises?.[activeExercise];
  const isMySQL = ex?.exercise_type === 'mysql';
  const isText = ex?.exercise_type === 'text' || (ex?.exercise_type && ex.exercise_type !== 'c' && ex.exercise_type !== 'mysql');

  const [viewMode, setViewMode] = useState<'launcher' | 'split'>('launcher');
  const [showAnswer, setShowAnswer] = useState(false);
  const [code, setCode] = useState('');
  const { output, setOutput, isRunning, setIsRunning } = useEditorStore();

  useEffect(() => {
    setShowAnswer(false);
    if (ex) {
      setCode(ex.starter_code || (ex.exercise_type === 'c'
        ? '#include <stdio.h>\n\nint main() {\n    // your code here\n    return 0;\n}\n'
        : '-- Write your SQL here\n'));
    }
  }, [ex]);

  const handleRun = async () => {
    if (!code.trim()) {
      toast.error('Write some code first!');
      return;
    }
    setIsRunning(true);
    try {
      const { data } = await executionService.runC(code);
      if (data && data.otp_required) {
        useDeviceOtpStore.getState().openModal(
          localStorage.getItem('nebcode_device_id') || '',
          () => {
            handleRun();
          }
        );
        return;
      }
      setOutput(data);
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Execution failed');
    } finally { setIsRunning(false); }
  };

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-350 overflow-hidden">
      {lesson.exercises.length > 1 && (
        <div className="flex gap-2 px-4 py-2.5 border-b border-dark-800 bg-dark-900 shrink-0 overflow-x-auto scrollbar-hide">
          {lesson.exercises.map((_: any, i: number) => (
            <button
              key={i}
              onClick={() => setActiveExercise(i)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap",
                i === activeExercise
                  ? "bg-neb-700 text-white shadow-md shadow-neb-950/30"
                  : "bg-dark-800 text-gray-400 hover:bg-dark-700 hover:text-gray-200"
              )}
            >
              Exercise {i + 1}
            </button>
          ))}
        </div>
      )}

      {ex && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* ─── TEXT / THEORY EXERCISE ─── */}
          {isText ? (
            <TextExerciseView
              ex={ex}
              onComplete={onComplete}
              showAnswer={showAnswer}
              setShowAnswer={setShowAnswer}
            />
          ) : viewMode === 'launcher' ? (
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              {/* Question Panel */}
              <div className="w-full md:w-[340px] flex-shrink-0 overflow-y-auto bg-[#07070e] border-r border-dark-800">
                {/* Question Header */}
                <div className="px-5 py-4 border-b border-dark-800 bg-dark-900/60">
                  <div className="flex items-center gap-2.5">
                    <div className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                      isMySQL ? "bg-blue-900/40 border border-blue-800/30" : "bg-neb-900/40 border border-neb-800/30"
                    )}>
                      {isMySQL ? <Database className="h-3.5 w-3.5 text-blue-400" /> : <Code2 className="h-3.5 w-3.5 text-neb-400" />}
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-extrabold tracking-widest text-gray-500">
                        {isMySQL ? 'MySQL Exercise' : 'C Language Exercise'}
                      </p>
                      <p className="text-xs font-bold text-white mt-0.5">Read the task below</p>
                    </div>
                  </div>
                </div>

                {/* Question Content */}
                <div className="p-5">
                  <div className="prose prose-invert prose-sm max-w-none leading-relaxed
                    prose-headings:text-white prose-headings:font-bold prose-headings:mt-4 prose-headings:mb-2
                    prose-p:text-gray-300 prose-p:leading-relaxed
                    prose-strong:text-white prose-strong:font-bold
                    prose-code:text-neb-400 prose-code:bg-dark-800 prose-code:px-1 prose-code:rounded prose-code:text-xs
                    prose-blockquote:border-l-neb-600 prose-blockquote:text-gray-400 prose-blockquote:bg-dark-900/50 prose-blockquote:py-1 prose-blockquote:pr-3 prose-blockquote:rounded-r-lg
                    prose-ul:text-gray-300 prose-li:marker:text-neb-500
                    prose-ol:text-gray-300">
                    <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
                      {ex.question}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>

              {/* Lab Launcher */}
              <div className="flex-1 flex items-center justify-center flex-col gap-6 p-8 text-center bg-[#05050a]">
                {/* Icon */}
                <div className={cn(
                  "w-20 h-20 rounded-2xl flex items-center justify-center shadow-2xl",
                  isMySQL
                    ? "bg-gradient-to-br from-blue-900/40 to-blue-950/20 border border-blue-800/30"
                    : "bg-gradient-to-br from-neb-900/40 to-neb-950/20 border border-neb-800/30"
                )}>
                  {isMySQL
                    ? <Database className="h-9 w-9 text-blue-400" />
                    : <Code2 className="h-9 w-9 text-neb-400" />}
                </div>

                {/* Text */}
                <div className="max-w-xs">
                  <h3 className="text-xl font-extrabold text-white">Ready to Code?</h3>
                  <p className="text-gray-400 text-sm mt-2 leading-relaxed">
                    Choose how you want to work on this exercise. Your starter code will be pre-loaded.
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col gap-3 w-full max-w-xs">
                  <Link
                    href={isMySQL
                      ? `/mysql-lab?exercise=${ex.id}&courseId=${courseId}&lessonId=${lessonId}`
                      : `/editor?exercise=${ex.id}&courseId=${courseId}&lessonId=${lessonId}`
                    }
                    className={cn(
                      "w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2.5 transition-all active:scale-95 shadow-lg text-sm",
                      isMySQL
                        ? "bg-blue-700 hover:bg-blue-600 text-white shadow-blue-950/30"
                        : "bg-neb-600 hover:bg-neb-500 text-white shadow-neb-950/30"
                    )}
                  >
                    {isMySQL ? <Database className="h-4 w-4" /> : <Code2 className="h-4 w-4" />}
                    Open Full-Screen Lab
                  </Link>

                  <button
                    onClick={() => setViewMode('split')}
                    className="w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2.5 bg-dark-800 border border-dark-700 hover:bg-dark-700 hover:border-dark-600 text-gray-300 hover:text-white transition-all text-sm"
                  >
                    <TerminalIcon className="h-4 w-4 text-neb-400" />
                    Solve In-Page (Split View)
                  </button>
                </div>

                {/* Hint */}
                <p className="text-xs text-gray-600 max-w-xs">
                  Tip: Full-Screen Lab gives you the best experience with a larger workspace.
                </p>

                <Button onClick={onComplete} variant="ghost" size="sm" className="text-xs text-gray-600 hover:text-gray-400 mt-1">
                  <CheckCircle className="h-3.5 w-3.5 mr-1.5 text-green-600" /> Mark as Completed without coding
                </Button>
              </div>
            </div>
          ) : (
            // Separate View (Scrollable Page Mode)
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 bg-[#040408]">
              {/* Info banner */}
              <div className="p-3 bg-dark-900/80 border border-dark-700 text-gray-400 text-xs rounded-xl flex items-center gap-2">
                <Info className="h-4 w-4 shrink-0 text-neb-400" />
                <span>Read the task, write your solution in the editor below, then run to see output.</span>
                <button
                  onClick={() => setViewMode('launcher')}
                  className="ml-auto shrink-0 text-[10px] font-bold text-gray-500 hover:text-white bg-dark-800 px-2 py-0.5 rounded transition"
                >
                  ← Back
                </button>
              </div>

              {/* Question */}
              <div className="bg-dark-900/60 border border-dark-800 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3.5 bg-dark-900 border-b border-dark-800">
                  <div className="flex items-center gap-2.5">
                    <div className={cn(
                      "w-6 h-6 rounded-md flex items-center justify-center shrink-0",
                      isMySQL ? "bg-blue-900/40 border border-blue-800/30" : "bg-neb-900/40 border border-neb-800/30"
                    )}>
                      {isMySQL ? <Database className="h-3 w-3 text-blue-400" /> : <Code2 className="h-3 w-3 text-neb-400" />}
                    </div>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-gray-300">
                      {isMySQL ? 'MySQL Exercise' : 'C Programming Exercise'}
                    </span>
                  </div>
                  <Link
                    href={isMySQL ? `/mysql-lab?exercise=${ex.id}&courseId=${courseId}&lessonId=${lessonId}` : `/editor?exercise=${ex.id}&courseId=${courseId}&lessonId=${lessonId}`}
                    className="text-xs bg-neb-600 hover:bg-neb-500 text-white px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5"
                  >
                    <Play className="h-3 w-3 fill-current" /> Full Screen
                  </Link>
                </div>
                <div className="p-5">
                  <div className="prose prose-invert prose-sm max-w-none leading-relaxed
                    prose-headings:text-white prose-headings:font-bold
                    prose-p:text-gray-300 prose-p:leading-relaxed
                    prose-strong:text-white
                    prose-code:text-neb-400 prose-code:bg-dark-800 prose-code:px-1 prose-code:rounded prose-code:text-xs
                    prose-blockquote:border-l-neb-600 prose-blockquote:text-gray-400
                    prose-ul:text-gray-300 prose-li:marker:text-neb-500">
                    <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
                      {ex.question}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>

              {/* Editor/Terminal section */}
              {isMySQL ? (
                <div className="space-y-5">
                  <div className="border border-dark-800 rounded-xl overflow-hidden bg-[#06060c]">
                    <div className="flex items-center justify-between px-4 py-2 bg-dark-900 border-b border-dark-800">
                      <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                        <Database className="h-3.5 w-3.5 text-blue-400" /> MySQL Terminal
                      </span>
                      <div className="flex gap-2">
                        {ex.answer && (
                          <button
                            onClick={() => setShowAnswer(!showAnswer)}
                            className={cn(
                              "px-2.5 py-1 rounded text-xs transition-all font-semibold flex items-center gap-1.5",
                              showAnswer
                                ? "bg-amber-950/40 border border-amber-800/30 text-amber-400"
                                : "bg-dark-800 border border-dark-700 text-gray-400 hover:text-white"
                            )}
                          >
                            {showAnswer ? (
                              <>
                                <EyeOff className="h-3.5 w-3.5" /> Hide Solution
                              </>
                            ) : (
                              <>
                                <Lightbulb className="h-3.5 w-3.5 text-amber-400" /> Show Solution
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="h-[400px]">
                      <MySQLEmbeddedTerminal title="MySQL Live Session" />
                    </div>
                  </div>

                  {showAnswer && ex.answer && (
                    <div className="bg-dark-900/60 border border-amber-800/30 rounded-xl p-5 space-y-3">
                      <p className="text-amber-400 font-bold text-xs flex items-center gap-1.5">
                        <Lightbulb className="h-4 w-4 text-amber-400" /> Expected SQL Solution
                      </p>
                      <pre className="font-mono text-xs text-emerald-300 overflow-x-auto bg-[#05050b] p-4 rounded-lg border border-dark-850 whitespace-pre leading-relaxed">
                        {ex.answer.correct_code}
                      </pre>
                      {ex.answer.explanation && (
                        <div className="mt-3 p-3 rounded-lg bg-dark-800/60 border border-dark-700">
                          <p className="text-[10px] uppercase font-bold text-gray-500 mb-1 tracking-wider">Explanation</p>
                          <p className="text-gray-300 text-xs leading-relaxed">{ex.answer.explanation}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Editor */}
                  <div className="border border-dark-800 rounded-xl overflow-hidden bg-[#06060c]">
                    <div className="flex items-center justify-between px-4 py-2 bg-dark-900 border-b border-dark-800">
                      <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                        <Code2 className="h-3.5 w-3.5 text-neb-400" /> Editor — main.c
                      </span>
                      <div className="flex gap-2">
                        {ex.answer && (
                          <button
                            onClick={() => setShowAnswer(!showAnswer)}
                            className={cn(
                              "px-2.5 py-1 rounded text-xs transition-all font-semibold flex items-center gap-1.5",
                              showAnswer
                                ? "bg-amber-950/40 border border-amber-800/30 text-amber-400"
                                : "bg-dark-800 border border-dark-700 text-gray-400 hover:text-white"
                            )}
                          >
                            {showAnswer ? (
                              <>
                                <EyeOff className="h-3.5 w-3.5" /> Hide Solution
                              </>
                            ) : (
                              <>
                                <Lightbulb className="h-3.5 w-3.5 text-amber-400" /> Show Solution
                              </>
                            )}
                          </button>
                        )}
                        <button
                          onClick={handleRun}
                          disabled={isRunning}
                          className="px-3 py-1.5 rounded-lg bg-neb-600 hover:bg-neb-500 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-1.5"
                        >
                          {isRunning
                            ? <span className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" />
                            : <Play className="h-3 w-3 fill-current" />
                          }
                          {isRunning ? 'Running...' : 'Run'}
                        </button>
                      </div>
                    </div>
                    <div className="h-[420px] relative">
                      <CodeEditor
                        height="100%"
                        language="c"
                        value={code}
                        onChange={v => setCode(v || '')}
                      />
                    </div>
                  </div>

                  {/* Output Console */}
                  <div className="border border-dark-800 rounded-xl overflow-hidden bg-[#06060c]">
                    <div className="px-4 py-2 bg-dark-900 border-b border-dark-800">
                      <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Output Console</span>
                    </div>
                    <div className="p-4 min-h-[80px]">
                      {isRunning ? (
                        <div className="flex items-center gap-2 text-gray-500 text-xs">
                          <span className="animate-spin h-3 w-3 border-2 border-neb-500 border-t-transparent rounded-full" />
                          Compiling and running your code...
                        </div>
                      ) : output ? (
                        <pre className={cn(
                          "font-mono text-xs leading-relaxed break-all whitespace-pre-wrap",
                          output.success ? "text-green-300" : "text-red-400"
                        )}>
                          {output.stdout || output.stderr || (output.success ? 'Execution completed with exit code 0.' : 'An unknown error occurred.')}
                        </pre>
                      ) : (
                        <p className="text-gray-600 text-xs italic">Click <strong className="text-gray-400">Run</strong> above to compile and execute your code.</p>
                      )}
                    </div>
                  </div>

                  {/* Solution */}
                  {showAnswer && ex.answer && (
                    <div className="bg-dark-900/60 border border-amber-800/30 rounded-xl p-5 space-y-3">
                      <p className="text-amber-400 font-bold text-xs flex items-center gap-1.5">
                        <Lightbulb className="h-4 w-4 text-amber-400" /> Expected Solution
                      </p>
                      <pre className="font-mono text-xs text-emerald-300 overflow-x-auto bg-[#05050b] p-4 rounded-lg border border-dark-850 whitespace-pre leading-relaxed">
                        {ex.answer.correct_code}
                      </pre>
                      {ex.answer.explanation && (
                        <div className="mt-3 p-3 rounded-lg bg-dark-800/60 border border-dark-700">
                          <p className="text-[10px] uppercase font-bold text-gray-500 mb-1 tracking-wider">Explanation</p>
                          <p className="text-gray-300 text-xs leading-relaxed">{ex.answer.explanation}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Text / Theory Exercise View ───────────────────────────────────────────────
function TextExerciseView({
  ex,
  onComplete,
  showAnswer,
  setShowAnswer,
}: {
  ex: any;
  onComplete: () => void;
  showAnswer: boolean;
  setShowAnswer: (v: boolean) => void;
}) {
  const [userAnswer, setUserAnswer] = useState('');
  const hasAnswer = ex?.answer?.correct_code || ex?.answer?.explanation;

  return (
    <div className="flex-1 overflow-y-auto animate-in fade-in duration-300">
      <div className="max-w-2xl mx-auto p-5 md:p-8 space-y-6">

        {/* Question Card */}
        <div className="bg-dark-900/60 border border-dark-800 rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 bg-dark-900 border-b border-dark-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-900/40 to-amber-950/20 border border-amber-800/30 flex items-center justify-center shrink-0">
              <FileText className="h-4 w-4 text-amber-400" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-extrabold tracking-widest text-amber-500/80">Theory Question</p>
              <p className="text-xs font-semibold text-white mt-0.5">Read carefully and write your answer below</p>
            </div>
          </div>

          {/* Question body */}
          <div className="px-6 py-5">
            <div className="prose prose-invert prose-sm max-w-none leading-relaxed
              prose-headings:text-white prose-headings:font-bold
              prose-p:text-gray-200 prose-p:leading-[1.85]
              prose-strong:text-white prose-strong:font-semibold
              prose-code:text-amber-400 prose-code:bg-dark-800 prose-code:px-1.5 prose-code:rounded prose-code:text-xs
              prose-blockquote:border-l-amber-600 prose-blockquote:text-gray-400 prose-blockquote:bg-dark-900/60 prose-blockquote:not-italic
              prose-ul:text-gray-200 prose-li:marker:text-amber-500
              prose-ol:text-gray-200">
              <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
                {ex.question}
              </ReactMarkdown>
            </div>
          </div>
        </div>

        {/* Answer Text Area */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <span className="w-5 h-5 rounded-md bg-dark-800 border border-dark-700 text-gray-300 flex items-center justify-center">
              <PenLine className="h-3 w-3 text-neb-400" />
            </span>
            Your Answer
          </label>
          <textarea
            value={userAnswer}
            onChange={e => setUserAnswer(e.target.value)}
            rows={6}
            placeholder="Type your answer here..."
            className="w-full bg-dark-900 border border-dark-700 rounded-xl px-4 py-3 text-gray-200 text-sm leading-relaxed placeholder-gray-600 resize-y focus:outline-none focus:border-neb-700 focus:ring-1 focus:ring-neb-800/60 transition font-sans"
          />
          <p className="text-[11px] text-gray-600">This is for your own reflection — your answer is not submitted anywhere.</p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          {hasAnswer && (
            <button
              onClick={() => setShowAnswer(!showAnswer)}
              className={cn(
                "flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all border",
                showAnswer
                  ? "bg-amber-950/30 border-amber-800/40 text-amber-400 hover:bg-amber-950/50"
                  : "bg-dark-900 border-dark-700 text-gray-300 hover:text-white hover:border-dark-600"
              )}
            >
              {showAnswer ? (
                <>
                  <EyeOff className="h-4 w-4" /> Hide Model Answer
                </>
              ) : (
                <>
                  <Lightbulb className="h-4 w-4 text-amber-400" /> Reveal Model Answer
                </>
              )}
            </button>
          )}
          <button
            onClick={onComplete}
            className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-green-800 hover:bg-green-700 text-white transition-all active:scale-95"
          >
            <CheckCircle className="h-4 w-4" /> Mark as Completed
          </button>
        </div>

        {/* Model Answer reveal */}
        {showAnswer && hasAnswer && (
          <div className="bg-dark-900/60 border border-amber-800/30 rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="px-5 py-3.5 bg-dark-900 border-b border-dark-800 flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-400" />
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400">Model Answer</span>
            </div>
            <div className="p-5 space-y-4">
              {ex.answer.correct_code && (
                <div className="prose prose-invert prose-sm max-w-none leading-relaxed
                  prose-p:text-gray-200 prose-p:leading-[1.85]
                  prose-strong:text-white
                  prose-ul:text-gray-200 prose-li:marker:text-amber-500">
                  <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
                    {ex.answer.correct_code}
                  </ReactMarkdown>
                </div>
              )}
              {ex.answer.explanation && (
                <div className="mt-3 p-4 rounded-xl bg-dark-800/60 border border-dark-700">
                  <p className="text-[10px] uppercase font-bold text-gray-500 mb-2 tracking-wider">Additional Explanation</p>
                  <p className="text-gray-300 text-sm leading-relaxed">{ex.answer.explanation}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

