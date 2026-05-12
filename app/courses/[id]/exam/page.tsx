'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { courseService } from '@/services';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { CheckCircle, XCircle, Trophy, Download, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';

type Phase = 'intro' | 'quiz' | 'result';

export default function ExamPage() {
  const { id: courseId } = useParams<{ id: string }>();
  const router = useRouter();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<Phase>('intro');
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<(number | null)[]>([]);
  const [result, setResult] = useState<{ score: number; passed: boolean; pass_percentage: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    courseService.getCourse(courseId)
      .then(res => setCourse(res.data))
      .catch(() => toast.error('Course not found'))
      .finally(() => setLoading(false));
  }, [courseId]);

  const exam = course?.exam;
  const questions = exam?.questions || [];

  const startExam = () => {
    setSelected(new Array(questions.length).fill(null));
    setCurrent(0);
    setPhase('quiz');
  };

  const selectOption = (idx: number) => {
    setSelected(prev => {
      const copy = [...prev];
      copy[current] = idx;
      return copy;
    });
  };

  const handleSubmit = async () => {
    if (selected.some(s => s === null)) {
      toast.error('Please answer all questions before submitting.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await courseService.submitExam(exam.id, selected as number[]);
      setResult(res.data);
      setPhase('result');
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Submission failed');
    } finally { setSubmitting(false); }
  };

  const handleDownloadCert = async () => {
    setDownloading(true);
    try {
      const res = await courseService.downloadCertificate(courseId);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nebcode-certificate-${courseId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Certificate not available yet'); }
    finally { setDownloading(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-[calc(100vh-56px)]"><Spinner className="h-8 w-8" /></div>;
  if (!exam) return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-56px)] text-center p-8">
      <XCircle className="h-12 w-12 text-dark-600 mb-4" />
      <h2 className="text-xl font-bold text-gray-400">No exam available</h2>
      <p className="text-gray-600 mt-2">This course does not have a final exam yet.</p>
      <Link href={`/courses/${courseId}`} className="mt-4">
        <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />Back to Course</Button>
      </Link>
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4 py-8 pb-24 md:pb-8">
      <div className="max-w-2xl w-full">

        {/* INTRO */}
        {phase === 'intro' && (
          <div className="bg-dark-900 border border-dark-700 rounded-2xl p-8 text-center shadow-2xl">
            <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">{exam.title}</h1>
            <p className="text-gray-400 mb-6">
              This exam has <strong className="text-white">{questions.length} questions</strong>.
              You need at least <strong className="text-neb-400">{exam.pass_percentage}%</strong> to pass and earn your certificate.
            </p>
            <div className="bg-dark-800 border border-dark-700 rounded-xl p-4 text-sm text-gray-500 mb-8 text-left space-y-2">
              <p>📌 Read each question carefully before answering.</p>
              <p>📌 You must answer all questions before submitting.</p>
              <p>📌 You can retake the exam if you don't pass.</p>
            </div>
            <Button onClick={startExam} className="w-full text-lg py-4">Start Exam</Button>
          </div>
        )}

        {/* QUIZ */}
        {phase === 'quiz' && (
          <div className="bg-dark-900 border border-dark-700 rounded-2xl overflow-hidden shadow-2xl">
            {/* Progress */}
            <div className="h-1.5 bg-dark-700">
              <div
                className="h-full bg-neb-600 transition-all duration-500"
                style={{ width: `${((current + 1) / questions.length) * 100}%` }}
              />
            </div>

            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <span className="text-xs text-gray-500 font-semibold">QUESTION {current + 1} / {questions.length}</span>
                <span className="text-xs text-gray-600">{questions.length - current - 1} remaining</span>
              </div>

              <h2 className="text-xl font-semibold mb-6 leading-relaxed">{questions[current]?.text}</h2>

              <div className="space-y-3">
                {questions[current]?.options?.map((opt: string, oi: number) => (
                  <button
                    key={oi}
                    onClick={() => selectOption(oi)}
                    className={cn(
                      "w-full text-left px-5 py-4 rounded-xl border text-sm font-medium transition-all duration-200",
                      selected[current] === oi
                        ? "bg-neb-800/50 border-neb-600 text-white shadow-lg shadow-neb-900/30"
                        : "bg-dark-800 border-dark-600 text-gray-300 hover:border-dark-500 hover:bg-dark-700"
                    )}
                  >
                    <span className={cn(
                      "inline-flex w-6 h-6 rounded-full items-center justify-center text-xs font-bold mr-3",
                      selected[current] === oi ? "bg-neb-600 text-white" : "bg-dark-600 text-gray-400"
                    )}>
                      {String.fromCharCode(65 + oi)}
                    </span>
                    {opt}
                  </button>
                ))}
              </div>

              <div className="flex justify-between mt-8 gap-3">
                <Button variant="ghost" size="sm" onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0}>
                  <ArrowLeft className="h-4 w-4 mr-1" /> Previous
                </Button>
                {current < questions.length - 1 ? (
                  <Button onClick={() => setCurrent(c => c + 1)} disabled={selected[current] === null} size="sm">
                    Next →
                  </Button>
                ) : (
                  <Button onClick={handleSubmit} isLoading={submitting} className="gap-2">
                    <CheckCircle className="h-4 w-4" /> Submit Exam
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* RESULT */}
        {phase === 'result' && result && (
          <div className="bg-dark-900 border border-dark-700 rounded-2xl p-8 text-center shadow-2xl">
            {result.passed ? (
              <>
                <Trophy className="h-20 w-20 text-yellow-400 mx-auto mb-4 drop-shadow-[0_0_20px_rgba(250,204,21,0.4)]" />
                <h2 className="text-3xl font-bold text-white mb-2">Congratulations! 🎉</h2>
                <p className="text-gray-400 mb-2">You scored <strong className="text-green-400 text-xl">{result.score.toFixed(1)}%</strong></p>
                <p className="text-gray-500 text-sm mb-8">You've passed the exam and earned your certificate!</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button onClick={handleDownloadCert} isLoading={downloading} className="gap-2">
                    <Download className="h-4 w-4" /> Download Certificate (PDF)
                  </Button>
                  <Link href={`/courses/${courseId}`}>
                    <Button variant="ghost" className="gap-2 w-full">
                      <ArrowLeft className="h-4 w-4" /> Back to Course
                    </Button>
                  </Link>
                </div>
              </>
            ) : (
              <>
                <XCircle className="h-20 w-20 text-red-500 mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-white mb-2">Almost there!</h2>
                <p className="text-gray-400 mb-2">You scored <strong className="text-red-400 text-xl">{result.score.toFixed(1)}%</strong></p>
                <p className="text-gray-500 text-sm mb-8">You need at least {result.pass_percentage}% to pass. Review the lessons and try again.</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button onClick={startExam} className="gap-2">Retry Exam</Button>
                  <Link href={`/courses/${courseId}`}>
                    <Button variant="ghost" className="gap-2 w-full">
                      <ArrowLeft className="h-4 w-4" /> Review Course
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
