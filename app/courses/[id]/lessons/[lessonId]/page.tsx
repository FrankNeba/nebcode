'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChevronLeft, CheckCircle, Code2, Eye, EyeOff, Play } from 'lucide-react';
import { Lesson } from '@/types';
import { courseService, executionService, progressService } from '@/services';
import { OutputConsole } from '@/components/editor/OutputConsole';
import { useEditorStore } from '@/store/editor.store';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import toast from 'react-hot-toast';
import { useDeviceOtpStore } from '@/store/device-otp.store';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

export default function LessonPage() {
  const { id: courseId, lessonId } = useParams<{ id: string; lessonId: string }>();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const { output, setOutput, isRunning, setIsRunning, showAnswer, toggleAnswer } = useEditorStore();
  const [code, setCode] = useState('');

  useEffect(() => {
    courseService.getLesson(lessonId).then(({ data }) => {
      setLesson(data);
      const ex = data.exercises?.[0];
      if (ex) {
        setCode(ex.starter_code || (ex.exercise_type === 'c'
          ? '#include <stdio.h>\n\nint main() {\n    // your code here\n    return 0;\n}\n'
          : '-- Write your SQL here\n'));
      }
    }).finally(() => setLoading(false));
  }, [lessonId]);

  const handleRun = async () => {
    const ex = lesson?.exercises?.[0];
    if (!ex || !code.trim()) { toast.error('Write some code first!'); return; }
    setIsRunning(true);
    try {
      const { data } = await executionService.runC(code);
      if (data && data.otp_required) {
        useDeviceOtpStore.getState().openModal(
          (typeof window !== 'undefined' ? localStorage.getItem('nebcode_device_id') : '') || '',
          () => { handleRun(); }
        );
        return;
      }
      setOutput(data);
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Execution failed');
    } finally { setIsRunning(false); }
  };

  const handleComplete = async () => {
    setCompleting(true);
    try { await progressService.markComplete(lessonId); setCompleted(true); toast.success('Lesson complete!'); }
    catch { toast.error('Could not save progress.'); }
    finally { setCompleting(false); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Spinner className="h-8 w-8" /></div>;
  if (!lesson) return <div className="text-center py-24 text-gray-600">Not found or access denied.</div>;

  const exercise = lesson.exercises?.[0];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link href={`/courses/${courseId}`} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-300 mb-5 transition-colors">
        <ChevronLeft className="h-4 w-4" /> Back to course
      </Link>

      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="font-bold text-2xl text-white mb-2">{lesson.title}</h1>
          <div className="flex gap-2 flex-wrap">
            <Badge>{lesson.lesson_type}</Badge>
            {lesson.has_exercise && <Badge variant="info"><Code2 className="h-3 w-3 mr-1" />Exercise</Badge>}
            {completed && <Badge variant="success"><CheckCircle className="h-3 w-3 mr-1" />Done</Badge>}
          </div>
        </div>
        <Button size="sm" variant={completed ? 'secondary' : 'primary'} isLoading={completing} onClick={handleComplete} disabled={completed}>
          <CheckCircle className="h-3.5 w-3.5" /> {completed ? 'Completed' : 'Mark done'}
        </Button>
      </div>

      {lesson.video_url && (() => {
        const videoId = lesson.video_url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([^&?/]+)/)?.[1];
        if (!videoId) return <a href={lesson.video_url} target="_blank" rel="noopener noreferrer" className="text-neb-400 underline">{lesson.video_url}</a>;
        return (
          <div className="mb-8 rounded-xl overflow-hidden aspect-video bg-dark-800 shadow-2xl my-6">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={lesson.title}
            />
          </div>
        );
      })()}

      {lesson.content && (
        <div className="card p-5 mb-8 prose prose-invert prose-sm max-w-none
          prose-headings:text-white prose-p:text-gray-400 prose-p:leading-relaxed
          prose-code:text-neb-300 prose-code:bg-dark-600 prose-code:px-1 prose-code:rounded
          prose-pre:bg-dark-700 prose-pre:border prose-pre:border-dark-600">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{lesson.content}</ReactMarkdown>
        </div>
      )}

      {exercise && (
        <div className="mt-6">
          <h2 className="font-semibold text-lg text-white mb-3">Exercise</h2>
          <div className="card p-4 mb-4 border-l-4 border-neb-600">
            <p className="text-gray-300 text-sm leading-relaxed">{exercise.question}</p>
          </div>
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <Button onClick={handleRun} isLoading={isRunning} size="sm"><Play className="h-3.5 w-3.5" /> Run</Button>
            {exercise.answer && (
              <Button onClick={toggleAnswer} variant={showAnswer ? 'danger' : 'ghost'} size="sm">
                {showAnswer ? <><EyeOff className="h-3.5 w-3.5" /> Hide Answer</> : <><Eye className="h-3.5 w-3.5" /> Show Answer</>}
              </Button>
            )}
          </div>
          <div className="rounded-xl overflow-hidden border border-dark-600 mb-4" style={{ height: 320 }}>
            <MonacoEditor height="100%" language={exercise.exercise_type === 'c' ? 'c' : 'sql'} value={code} onChange={v => setCode(v || '')} theme="vs-dark"
              options={{ fontSize: 13, fontFamily: '"JetBrains Mono", monospace', minimap: { enabled: false }, padding: { top: 12 }, tabSize: 4, automaticLayout: true }} />
          </div>
          <div className="h-40"><OutputConsole /></div>
          {showAnswer && exercise.answer && (
            <div className="mt-4 card p-4 border border-neb-800/50 animate-fade-in">
              <p className="text-neb-400 font-semibold text-sm mb-2">Answer</p>
              <pre className="font-mono text-emerald-300 text-xs overflow-x-auto leading-relaxed">{exercise.answer.correct_code}</pre>
              {exercise.answer.explanation && <p className="text-gray-400 text-xs mt-3 border-t border-dark-600 pt-3">{exercise.answer.explanation}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
