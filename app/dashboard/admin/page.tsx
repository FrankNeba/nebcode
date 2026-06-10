'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileCode, CheckCircle, AlertTriangle, Play, HelpCircle, Eye, Database, Code2, BookOpen, Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth.store';
import { courseService } from '@/services';
import { Button } from '@/components/ui/Button';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';

export default function CourseAdminPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const router = useRouter();

  const [jsonText, setJsonText] = useState('');
  const [courseData, setCourseData] = useState<any>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedPreviewLesson, setSelectedPreviewLesson] = useState<any>(null);

  // Hydration guard — Zustand persist rehydrates asynchronously on first mount.
  // We wait one tick so `user` is always the stored value, not the initial null.
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;                   // not yet hydrated, wait
    if (authLoading) return;               // still fetching from server
    if (!isAuthenticated || !user?.is_staff) {
      toast.error('Access denied. Staff only.');
      router.push('/dashboard');
    }
  }, [mounted, user, isAuthenticated, authLoading, router]);

  // Show spinner while store is rehydrating OR while auth is loading
  if (!mounted || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-56px)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neb-500"></div>
      </div>
    );
  }

  if (!user?.is_staff) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-56px)] p-6 text-center">
        <AlertTriangle className="h-16 w-16 text-red-500 mb-4 animate-bounce" />
        <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
        <p className="text-gray-400 max-w-md">You do not have administrative privileges to access this dashboard.</p>
      </div>
    );
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setJsonText(text);
      validateAndParse(text);
    };
    reader.readAsText(file);
  };

  const validateAndParse = (text: string) => {
    setValidationError(null);
    setCourseData(null);
    setSelectedPreviewLesson(null);

    if (!text.trim()) return;

    try {
      const parsed = JSON.parse(text);
      
      // Basic structure validation
      if (!parsed.title) {
        throw new Error("Missing 'title' at course root level.");
      }
      if (parsed.price !== undefined && typeof parsed.price !== 'number') {
        throw new Error("'price' must be a number.");
      }
      if (parsed.modules && !Array.isArray(parsed.modules)) {
        throw new Error("'modules' must be an array.");
      }

      // Validate modules & lessons
      if (parsed.modules) {
        parsed.modules.forEach((mod: any, mIdx: number) => {
          if (!mod.title) {
            throw new Error(`Module index ${mIdx} is missing a 'title'.`);
          }
          if (mod.lessons && !Array.isArray(mod.lessons)) {
            throw new Error(`Lessons in module '${mod.title}' must be an array.`);
          }
          if (mod.lessons) {
            mod.lessons.forEach((les: any, lIdx: number) => {
              if (!les.title) {
                throw new Error(`Lesson index ${lIdx} in module '${mod.title}' is missing a 'title'.`);
              }
              if (les.sections && !Array.isArray(les.sections)) {
                throw new Error(`Sections in lesson '${les.title}' must be an array.`);
              }
              if (les.exercises && !Array.isArray(les.exercises)) {
                throw new Error(`Exercises in lesson '${les.title}' must be an array.`);
              }
            });
          }
        });
      }

      setCourseData(parsed);
      toast.success('JSON parsed and validated successfully!');
    } catch (err: any) {
      setValidationError(err.message || 'Invalid JSON syntax.');
    }
  };

  const handleImport = async () => {
    if (!courseData) return;
    setIsUploading(true);
    try {
      await courseService.importCourse(courseData);
      toast.success('Course imported successfully!');
      setJsonText('');
      setCourseData(null);
      setSelectedPreviewLesson(null);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Import failed. Check server logs.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-24">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
            <Layers className="h-8 w-8 text-neb-500" /> Admin Course Uploader
          </h1>
          <p className="text-gray-400 text-sm mt-1">Upload and preview hierarchically structured courses (Modules, Lessons, Sections, Exercises).</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={handleImport}
            disabled={!courseData || isUploading}
            isLoading={isUploading}
            className="shadow-neb bg-neb-600 hover:bg-neb-500 px-6 py-2"
          >
            Import Course
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* JSON Editor / Uploader Panel */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="card p-6 bg-dark-900/40 border-dark-800 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <FileCode className="h-5 w-5 text-neb-400" /> JSON Course Template
              </h2>
              <label className="text-xs cursor-pointer px-3 py-1.5 rounded-lg bg-dark-800 border border-dark-750 hover:bg-dark-700 hover:text-white transition flex items-center gap-1.5">
                <Upload className="h-3.5 w-3.5 text-gray-400" /> Upload File
                <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            <textarea
              value={jsonText}
              onChange={(e) => {
                setJsonText(e.target.value);
                validateAndParse(e.target.value);
              }}
              placeholder={`{
  "title": "Introduction to MySQL",
  "category": "mysql",
  "description": "Learn databases from scratch...",
  "price": 25000,
  "is_free": false,
  "modules": [
    {
      "title": "Module 1: Getting Started",
      "order": 1,
      "lessons": [
        {
          "title": "Lesson 1.1: Database Concepts",
          "content": "# Intro to SQL\\nThis is markdown with LaTeX: $a^2 + b^2 = c^2$.",
          "lesson_type": "text",
          "order": 1,
          "sections": [
            {
              "title": "Relational Databases",
              "content": "Explanation of schemas...",
              "order": 1
            }
          ],
          "exercises": [
            {
              "question": "Write a query to fetch all students.",
              "exercise_type": "mysql",
              "starter_code": "SELECT * FROM students;",
              "answer": {
                "correct_code": "SELECT * FROM students;",
                "explanation": "Simple query."
              }
            }
          ]
        }
      ]
    }
  ]
}`}
              className="w-full h-[320px] md:h-[450px] bg-dark-950 font-mono text-xs text-gray-300 p-4 rounded-xl border border-dark-800 outline-none focus:border-neb-500/50 resize-y"
              spellCheck={false}
            />

            {/* Validation Feedback */}
            {validationError && (
              <div className="flex items-start gap-2 p-3 bg-red-950/20 border border-red-900/30 rounded-xl text-xs text-red-400 animate-in fade-in duration-300">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{validationError}</span>
              </div>
            )}

            {courseData && (
              <div className="flex items-center gap-2 p-3 bg-green-950/20 border border-green-900/30 rounded-xl text-xs text-green-400 animate-in fade-in duration-300">
                <CheckCircle className="h-4 w-4 shrink-0" />
                <span>JSON structural checks passed successfully! Ready to import.</span>
              </div>
            )}
          </div>
        </div>

        {/* Real-time Formatting & Hierarchy Preview Panel */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="card p-6 bg-dark-900/40 border-dark-800 flex flex-col gap-5 min-h-[480px]">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Eye className="h-5 w-5 text-neb-400" /> Structure & Render Preview
            </h2>

            {!courseData ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <BookOpen className="h-12 w-16 text-dark-700 mb-3" />
                <p className="text-sm text-gray-500">Provide a valid JSON configuration on the left to review the formatting structure.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-6 animate-in fade-in duration-500">
                {/* Course Metadata Card */}
                <div className="p-4 bg-dark-950/60 border border-dark-850 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-neb-950/40 border border-neb-800/30 text-neb-400">
                      {courseData.category || 'others'}
                    </span>
                    <h3 className="text-lg font-bold text-white mt-1.5">{courseData.title}</h3>
                    <p className="text-xs text-gray-400 mt-1">{courseData.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-500">Price Structure</p>
                    <p className="text-sm font-bold text-neb-400">
                      {courseData.is_free ? 'Free Course' : `${Number(courseData.price || 0).toLocaleString()} XAF`}
                    </p>
                  </div>
                </div>

                {/* Main Tree structure */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                  {/* Modules & Lessons Tree */}
                  <div className="md:col-span-5 flex flex-col gap-3 max-h-[380px] overflow-y-auto pr-1">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Hierarchy Outline</p>
                    {courseData.modules?.map((mod: any, mIdx: number) => (
                      <div key={mIdx} className="flex flex-col gap-1">
                        <div className="text-xs font-bold text-gray-300 bg-dark-950 px-2.5 py-1.5 rounded-lg border border-dark-850 truncate">
                          {mod.title}
                        </div>
                        <div className="pl-4 flex flex-col gap-1 border-l border-dark-800 ml-2 mt-1">
                          {mod.lessons?.map((les: any, lIdx: number) => (
                            <button
                              key={lIdx}
                              onClick={() => setSelectedPreviewLesson(les)}
                              className={`text-left text-xs px-2.5 py-2 rounded-lg transition-all ${
                                selectedPreviewLesson === les
                                  ? 'bg-neb-900/50 text-neb-400 border border-neb-800/40'
                                  : 'text-gray-400 hover:text-white hover:bg-dark-950/40 border border-transparent'
                              }`}
                            >
                              📁 {les.title}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Render preview for selected lesson */}
                  <div className="md:col-span-7 flex flex-col gap-4 border border-dark-850 bg-dark-950/40 p-4 rounded-xl max-h-[380px] overflow-y-auto">
                    {!selectedPreviewLesson ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-500">
                        <HelpCircle className="h-8 w-8 mb-2 opacity-50" />
                        <p className="text-xs">Select a lesson from the outline to inspect content rendering.</p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4">
                        <div>
                          <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-dark-800 text-gray-400">
                            {selectedPreviewLesson.lesson_type || 'text'}
                          </span>
                          <h4 className="text-sm font-bold text-white mt-1">{selectedPreviewLesson.title}</h4>
                        </div>

                        {/* Rendering main content (Markdown + LaTeX) */}
                        {selectedPreviewLesson.content && (
                          <div className="p-3 bg-[#0d0d16]/30 border border-dark-850 rounded-lg">
                            <p className="text-[10px] text-gray-500 mb-2 font-semibold">Rendered Lesson Content:</p>
                            <div className="prose prose-invert prose-xs leading-relaxed max-w-none
                              prose-headings:text-white prose-code:text-neb-400 prose-code:bg-dark-950 prose-code:rounded prose-code:px-1
                              prose-pre:bg-dark-950 prose-pre:rounded-lg prose-pre:border prose-pre:border-dark-800 prose-pre:p-2.5">
                              <ReactMarkdown
                                remarkPlugins={[remarkMath]}
                                rehypePlugins={[rehypeKatex, rehypeRaw as any]}
                              >
                                {selectedPreviewLesson.content}
                              </ReactMarkdown>
                            </div>
                          </div>
                        )}

                        {/* Sections rendering */}
                        {selectedPreviewLesson.sections && selectedPreviewLesson.sections.length > 0 && (
                          <div className="flex flex-col gap-2.5">
                            <p className="text-[10px] text-gray-500 font-semibold">Hierarchy Subsections:</p>
                            {selectedPreviewLesson.sections.map((sect: any, sIdx: number) => (
                              <div key={sIdx} className="p-3 bg-dark-950 border border-dark-850 rounded-lg">
                                <h5 className="text-xs font-bold text-neb-400 mb-1">{sect.title}</h5>
                                <div className="prose prose-invert prose-xs leading-relaxed max-w-none">
                                  <ReactMarkdown
                                    remarkPlugins={[remarkMath, remarkGfm]}
                                    rehypePlugins={[rehypeKatex, rehypeRaw as any]}
                                  >
                                    {sect.content}
                                  </ReactMarkdown>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Exercises rendering */}
                        {selectedPreviewLesson.exercises && selectedPreviewLesson.exercises.length > 0 && (
                          <div className="flex flex-col gap-2.5">
                            <p className="text-[10px] text-gray-500 font-semibold">Interactive Exercises:</p>
                            {selectedPreviewLesson.exercises.map((ex: any, eIdx: number) => {
                              const isSQL = ex.exercise_type === 'mysql';
                              return (
                                <div key={eIdx} className="p-3 bg-dark-950 border border-dark-850 rounded-lg flex flex-col gap-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-bold text-gray-500 uppercase">Exercise {eIdx + 1}</span>
                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${isSQL ? 'bg-blue-950/40 text-blue-400' : 'bg-neb-950/40 text-neb-400'}`}>
                                      {isSQL ? 'MySQL Terminal' : 'C Execution'}
                                    </span>
                                  </div>
                                  <div className="prose prose-invert prose-xs leading-relaxed max-w-none">
                                    <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
                                      {ex.question}
                                    </ReactMarkdown>
                                  </div>
                                  {ex.starter_code && (
                                    <div>
                                      <p className="text-[9px] text-gray-500 mb-1">Starter Code Template:</p>
                                      <pre className="bg-[#05050b] text-gray-400 text-xs p-2 rounded-lg font-mono border border-dark-800/60 overflow-x-auto">
                                        <code>{ex.starter_code}</code>
                                      </pre>
                                    </div>
                                  )}
                                  {ex.answer && (
                                    <div className="p-2 bg-neb-950/20 border border-neb-900/30 rounded-lg text-xs">
                                      <p className="font-semibold text-neb-400 text-[10px]">Expected Answer:</p>
                                      <pre className="bg-dark-950 text-green-300 p-1.5 rounded font-mono text-[10px] mt-1 border border-dark-850">
                                        <code>{ex.answer.correct_code}</code>
                                      </pre>
                                      {ex.answer.explanation && (
                                        <p className="text-gray-400 text-[10px] mt-1.5"><strong>Explanation:</strong> {ex.answer.explanation}</p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
