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
import { CheckCircle, Code2, Database, ArrowLeft, ArrowRight, Terminal as TerminalIcon, Play, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { MySQLEmbeddedTerminal } from '@/components/courses/MySQLEmbeddedTerminal';
import { useEditorStore } from '@/store/editor.store';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

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
        // const codeString = String(children).replace(/\\n$/, '');
        const codeString = " "
        return (
          <div className="my-5 rounded-xl border border-dark-800 bg-[#06060c] overflow-hidden shadow-2xl">
            <div className="px-4 py-2 bg-dark-900 border-b border-dark-800 flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-widest text-neb-400 font-mono">
                {lang === 'sql' ? '⚡ SQL COMMAND' : `${lang.toUpperCase()} CODE`}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const code = String(children).replace(/\\n$/, '');
                    navigator.clipboard.writeText(code);
                    toast.success('Copied to clipboard!');
                  }}
                  className="text-[10px] text-gray-500 hover:text-white transition-all bg-dark-950 px-2 py-1 rounded border border-dark-800 font-sans"
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
                <div className="prose prose-invert prose-sm max-w-none leading-relaxed
                  prose-headings:text-white prose-headings:font-bold
                  prose-blockquote:border-l-neb-600 prose-blockquote:text-gray-400
                  prose-a:text-neb-400 prose-a:no-underline hover:prose-a:underline">
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
      setOutput(data);
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Execution failed');
    } finally { setIsRunning(false); }
  };

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-350 overflow-hidden">
      {lesson.exercises.length > 1 && (
        <div className="flex gap-2 px-4 py-2.5 border-b border-dark-800 bg-dark-900 shrink-0">
          {lesson.exercises.map((_: any, i: number) => (
            <button
              key={i}
              onClick={() => setActiveExercise(i)}
              className={cn("px-3 py-1 rounded-lg text-xs font-semibold transition", i === activeExercise ? "bg-neb-700 text-white" : "bg-dark-800 text-gray-400 hover:bg-dark-750")}
            >
              Exercise {i + 1}
            </button>
          ))}
        </div>
      )}

      {ex && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {viewMode === 'launcher' ? (
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              {/* Question Panel */}
              <div className="w-full md:w-80 flex-shrink-0 p-5 border-r border-dark-800 overflow-y-auto bg-[#090910] text-sm">
                <div className="flex items-center gap-2 mb-4">
                  {isMySQL ? <Database className="h-4 w-4 text-blue-400" /> : <Code2 className="h-4 w-4 text-neb-400" />}
                  <span className="text-xs font-extrabold uppercase text-gray-400">{isMySQL ? 'MySQL Statement' : 'C Language'}</span>
                </div>
                <div className="prose prose-invert prose-sm max-w-none leading-relaxed">
                  <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
                    {ex.question}
                  </ReactMarkdown>
                </div>
              </div>

              {/* Lab Launcher */}
              <div className="flex-1 flex items-center justify-center flex-col gap-5 p-8 text-center bg-[#05050a]/40">
                <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl", isMySQL ? "bg-blue-900/20 border border-blue-800/20" : "bg-neb-900/20 border border-neb-800/20")}>
                  {isMySQL ? <Database className="h-8 w-8 text-blue-400" /> : <Code2 className="h-8 w-8 text-neb-400" />}
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-white">Execute in Sandboxed Lab</h3>
                  <p className="text-gray-400 text-xs mt-2 max-w-xs mx-auto leading-relaxed">
                    We have prepared a secure container sandbox environment with your starter code template loaded.
                  </p>
                </div>

                <div className="flex flex-col gap-2.5 w-full max-w-xs">
                  <Link
                    href={isMySQL ? `/mysql-lab?exercise=${ex.id}&courseId=${courseId}&lessonId=${lessonId}` : `/editor?exercise=${ex.id}&courseId=${courseId}&lessonId=${lessonId}`}
                    className="w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 bg-neb-600 hover:bg-neb-500 text-white transition-all active:scale-95 shadow-lg shadow-neb-950/20 text-xs"
                  >
                    {isMySQL ? <Database className="h-4 w-4" /> : <Code2 className="h-4 w-4" />}
                    Launch Full-screen Sandbox
                  </Link>

                  <button
                    onClick={() => setViewMode('split')}
                    className="w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 bg-dark-900 border border-dark-800 hover:bg-dark-800 text-gray-300 hover:text-white transition-all text-xs"
                  >
                    <TerminalIcon className="h-4 w-4 text-neb-400" />
                    Separate View (Split Screen)
                  </button>
                </div>

                <Button onClick={onComplete} variant="ghost" size="sm" className="mt-2 text-xs text-gray-500 hover:text-gray-300">
                  <CheckCircle className="h-4 w-4 mr-1 text-green-500" /> Mark as Completed
                </Button>
              </div>
            </div>
          ) : (
            // Separate View (Scrollable Page Mode)
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-[#040408]">
              {/* Scroll notification banner */}
              <div className="p-3 bg-neb-950/40 border border-neb-800/30 text-neb-300 text-xs rounded-xl flex items-center gap-2">
                <Info className="h-4 w-4 shrink-0 text-neb-400" />
                <span>Scroll down to see the editor, and scroll further down to view the output and expected solution.</span>
              </div>

              {/* Question */}
              <div className="bg-[#090910] p-5 rounded-xl border border-dark-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {isMySQL ? <Database className="h-4 w-4 text-blue-400" /> : <Code2 className="h-4 w-4 text-neb-400" />}
                    <span className="text-xs font-extrabold uppercase text-gray-400">{isMySQL ? 'MySQL Exercise' : 'C Exercise'}</span>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={isMySQL ? `/mysql-lab?exercise=${ex.id}&courseId=${courseId}&lessonId=${lessonId}` : `/editor?exercise=${ex.id}&courseId=${courseId}&lessonId=${lessonId}`}
                      className="text-xs bg-neb-600 hover:bg-neb-500 text-white px-2.5 py-1 rounded font-bold transition"
                    >
                      Full Screen
                    </Link>
                    <button
                      onClick={() => setViewMode('launcher')}
                      className="text-xs text-gray-400 hover:text-white px-2.5 py-1 rounded bg-dark-800 hover:bg-dark-700 transition"
                    >
                      Exit View
                    </button>
                  </div>
                </div>
                <div className="prose prose-invert prose-sm max-w-none leading-relaxed">
                  <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
                    {ex.question}
                  </ReactMarkdown>
                </div>
              </div>

              {/* Editor/Terminal section */}
              {isMySQL ? (
                <div className="space-y-6">
                  <div className="h-[450px] border border-dark-800 rounded-xl overflow-hidden bg-[#06060c]">
                    <div className="flex items-center justify-between px-3 py-1.5 bg-dark-900 border-b border-dark-800 shrink-0">
                      <span className="text-[11px] font-bold text-gray-400">MySQL Terminal</span>
                      <div className="flex gap-2">
                        {ex.answer && (
                          <button
                            onClick={() => setShowAnswer(!showAnswer)}
                            className={cn(
                              "px-2.5 py-1 rounded text-[11px] transition-all font-semibold",
                              showAnswer ? "bg-red-950/40 border border-red-800/30 text-red-400" : "bg-dark-800 border border-dark-700 text-gray-400 hover:text-white"
                            )}
                          >
                            {showAnswer ? 'Hide Answer' : 'Show Answer'}
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="h-[calc(100%-34px)]">
                      <MySQLEmbeddedTerminal title="MySQL Live Session" />
                    </div>
                  </div>

                  {showAnswer && ex.answer && (
                    <div className="bg-[#090910] border border-dark-800 rounded-xl p-5 space-y-3">
                      <p className="text-neb-400 font-bold text-xs">Expected SQL query:</p>
                      <pre className="font-mono text-xs text-emerald-300 overflow-x-auto bg-[#05050b] p-3 rounded-lg border border-dark-850 whitespace-pre">
                        {ex.answer.correct_code}
                      </pre>
                      {ex.answer.explanation && (
                        <p className="text-gray-450 text-xs leading-relaxed mt-2">{ex.answer.explanation}</p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Editor */}
                  <div className="border border-dark-800 rounded-xl overflow-hidden bg-[#06060c]">
                    <div className="flex items-center justify-between px-3 py-1.5 bg-dark-900 border-b border-dark-800 shrink-0">
                      <span className="text-[11px] font-bold text-gray-400">Editor (main.c)</span>
                      <div className="flex gap-2">
                        {ex.answer && (
                          <button
                            onClick={() => setShowAnswer(!showAnswer)}
                            className={cn(
                              "px-2.5 py-1 rounded text-[11px] transition-all font-semibold",
                              showAnswer ? "bg-red-950/40 border border-red-800/30 text-red-400" : "bg-dark-800 border border-dark-700 text-gray-400 hover:text-white"
                            )}
                          >
                            {showAnswer ? 'Hide Answer' : 'Show Answer'}
                          </button>
                        )}
                        <button
                          onClick={handleRun}
                          disabled={isRunning}
                          className="px-3 py-1 rounded bg-neb-600 hover:bg-neb-500 disabled:opacity-50 text-white text-[11px] font-bold transition flex items-center gap-1"
                        >
                          <Play className="h-3 w-3 fill-current" /> Run
                        </button>
                      </div>
                    </div>
                    <div className="h-[450px] relative">
                      <MonacoEditor
                        height="100%"
                        language="c"
                        value={code}
                        onChange={v => setCode(v || '')}
                        theme="vs-dark"
                        options={{
                          fontSize: 13,
                          fontFamily: '"JetBrains Mono", monospace',
                          minimap: { enabled: false },
                          padding: { top: 8 },
                          tabSize: 4,
                          automaticLayout: true,
                          wordWrap: 'on',
                          lineNumbers: 'on',
                        }}
                      />
                    </div>
                  </div>

                  {/* Output Console & Solution */}
                  <div className="bg-[#090910] border border-dark-800 rounded-xl p-5 space-y-4">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-2">Output Console</p>
                      {isRunning ? (
                        <p className="text-gray-500 text-xs italic animate-pulse">Running C compiler...</p>
                      ) : output ? (
                        <pre className={cn("font-mono text-xs leading-relaxed break-all whitespace-pre-wrap p-3 rounded-lg bg-[#05050b] border border-dark-850", output.success ? "text-green-300" : "text-red-400")}>
                          {output.stdout || output.stderr || (output.success ? 'Execution completed with return code 0.' : 'Unknown error occurred.')}
                        </pre>
                      ) : (
                        <p className="text-gray-650 text-xs italic">Click 'Run' to compile and execute C code.</p>
                      )}
                    </div>

                    {showAnswer && ex.answer && (
                      <div className="pt-4 border-t border-dark-850 space-y-3">
                        <p className="text-neb-400 font-bold text-xs">Expected Code:</p>
                        <pre className="font-mono text-xs text-emerald-300 overflow-x-auto bg-[#05050b] p-3 rounded-lg border border-dark-850 whitespace-pre">
                          {ex.answer.correct_code}
                        </pre>
                        {ex.answer.explanation && (
                          <p className="text-gray-450 text-xs leading-relaxed mt-2">{ex.answer.explanation}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
