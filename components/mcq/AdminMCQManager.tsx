'use client';
import React, { useState, useEffect } from 'react';
import {
  Upload,
  Plus,
  Trash2,
  Edit,
  Eye,
  Check,
  X,
  Clock,
  Calendar,
  FileText,
  Image as ImageIcon,
  Search,
  ArrowLeft,
  Download,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Code2,
  HelpCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { mcqService } from '@/services';
import { Button } from '@/components/ui/Button';
import { KatexRenderer } from '@/components/mcq/KatexRenderer';
import { cn } from '@/lib/utils';

const SAMPLE_PAPER_TEMPLATE = {
  name: 'GCE Advanced Level Computer Science Paper 1',
  year: 2024,
  duration_minutes: 90,
  description: 'Official 50-question Multiple Choice Paper covering Algorithms, Data Structures, C Programming, Databases, Architecture, and Boolean Algebra.',
  questions: Array.from({ length: 50 }, (_, i) => {
    const qNum = i + 1;
    if (qNum === 1) {
      return {
        order: 1,
        text: 'What is the time complexity of binary search on a sorted array of $n$ elements?',
        options: ['$O(n)$', '$O(\\log_2 n)$', '$O(n \\log_2 n)$', '$O(1)$'],
        correct_option: 'B',
        explanation: 'Binary search halves the search space at each step, giving recurrence $T(n) = T(n/2) + O(1)$, which resolves to $\\Theta(\\log_2 n)$.',
      };
    }
    if (qNum === 2) {
      return {
        order: 2,
        text: 'Simplify the Boolean expression $F = A \\cdot B + A \\cdot \\overline{B}$ using Boolean algebra laws.',
        options: ['$A$', '$B$', '$A + B$', '$1$'],
        correct_option: 'A',
        explanation: 'By the distributive law, $A \\cdot B + A \\cdot \\overline{B} = A \\cdot (B + \\overline{B}) = A \\cdot 1 = A$.',
      };
    }
    return {
      order: qNum,
      text: `Sample Question #${qNum}: Evaluate the expression $\\sum_{k=1}^{n} k$ for $n = ${qNum + 4}$.`,
      options: [
        `$\\frac{n(n+1)}{2} = ${((qNum + 4) * (qNum + 5)) / 2}$`,
        `$n^2 = ${(qNum + 4) * (qNum + 4)}$`,
        `$2n = ${2 * (qNum + 4)}$`,
        `$n!$`
      ],
      correct_option: 'A',
      explanation: `Using the arithmetic series formula $$S_n = \\frac{n(n+1)}{2}$$, substituting $n = ${qNum + 4}$ yields $${((qNum + 4) * (qNum + 5)) / 2}$$.`,
    };
  }),
};

export function AdminMCQManager() {
  const [papers, setPapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [subView, setSubView] = useState<'list' | 'upload' | 'questions'>('list');

  // Selected paper for managing 50 questions & uploading images
  const [activePaper, setActivePaper] = useState<any | null>(null);
  const [paperDetailLoading, setPaperDetailLoading] = useState(false);
  const [questionFilter, setQuestionFilter] = useState<'all' | 'with_images' | 'without_images'>('all');
  const [questionSearch, setQuestionSearch] = useState('');

  // Upload Paper Form State
  const [uploadName, setUploadName] = useState('');
  const [uploadYear, setUploadYear] = useState<number>(new Date().getFullYear());
  const [uploadDuration, setUploadDuration] = useState<number>(90);
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadJsonText, setUploadJsonText] = useState('');
  const [parsedPreview, setParsedPreview] = useState<any | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Edit Paper Metadata Modal
  const [editingPaperMeta, setEditingPaperMeta] = useState<any | null>(null);
  const [paperMetaForm, setPaperMetaForm] = useState({
    name: '',
    year: 2024,
    duration_minutes: 90,
    description: '',
    is_active: true,
    is_free: true,
  });
  const [savingPaperMeta, setSavingPaperMeta] = useState(false);

  // Edit Question (KaTeX + Images) Modal
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null);
  const [qForm, setQForm] = useState({
    order: 1,
    text: '',
    options: ['', '', '', ''],
    correct_option_index: 0,
    explanation: '',
  });
  const [savingQuestion, setSavingQuestion] = useState(false);
  const [uploadingImageKey, setUploadingImageKey] = useState<string | null>(null);

  // Bulk JSON Editor Modal
  const [jsonModalPaperId, setJsonModalPaperId] = useState<string | null>(null);
  const [jsonModalText, setJsonModalText] = useState('');
  const [loadingPaperJson, setLoadingPaperJson] = useState(false);
  const [savingPaperJson, setSavingPaperJson] = useState(false);

  const fetchPapers = async () => {
    setLoading(true);
    try {
      const { data } = await mcqService.getAdminPapers();
      setPapers(Array.isArray(data) ? data : data?.results || []);
    } catch {
      toast.error('Failed to load MCQ papers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPapers();
  }, []);

  const openPaperQuestions = async (paperId: string) => {
    setPaperDetailLoading(true);
    setSubView('questions');
    try {
      const { data } = await mcqService.getAdminPaperDetail(paperId);
      setActivePaper(data);
    } catch {
      toast.error('Failed to load paper questions');
      setSubView('list');
    } finally {
      setPaperDetailLoading(false);
    }
  };

  const refreshActivePaper = async () => {
    if (!activePaper?.id) return;
    try {
      const { data } = await mcqService.getAdminPaperDetail(activePaper.id);
      setActivePaper(data);
      fetchPapers();
    } catch {
      // ignore
    }
  };

  // Validate JSON when pasting or uploading a file
  const handleValidateJson = (rawText: string) => {
    setUploadJsonText(rawText);
    setParseError(null);
    setParsedPreview(null);

    if (!rawText.trim()) return;

    try {
      const parsed = JSON.parse(rawText);
      const rootObj = Array.isArray(parsed) ? { questions: parsed } : parsed;

      if (rootObj.name || rootObj.title) {
        setUploadName(prev => prev || String(rootObj.name || rootObj.title));
      }
      if (rootObj.year && !isNaN(Number(rootObj.year))) {
        setUploadYear(Number(rootObj.year));
      }
      if (rootObj.duration_minutes || rootObj.duration) {
        setUploadDuration(Number(rootObj.duration_minutes || rootObj.duration));
      }
      if (rootObj.description) {
        setUploadDescription(prev => prev || String(rootObj.description));
      }

      const questions = rootObj.questions;
      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error("JSON must contain a non-empty 'questions' array.");
      }

      questions.forEach((q: any, idx: number) => {
        const qText = q.text || q.question || q.prompt;
        if (!qText) {
          throw new Error(`Question #${idx + 1} is missing 'text' (or 'question').`);
        }
        const opts = q.options || (q.option_a ? [q.option_a, q.option_b, q.option_c, q.option_d] : null);
        if (!Array.isArray(opts) || opts.length < 4) {
          throw new Error(`Question #${idx + 1} must have 4 options.`);
        }
      });

      setParsedPreview({
        questionCount: questions.length,
        sampleQuestion: questions[0],
        raw: rootObj,
      });
    } catch (e: any) {
      setParseError(e.message || 'Invalid JSON format');
    }
  };

  const handleJsonFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      handleValidateJson(content);
    };
    reader.readAsText(file);
  };

  const handleDownloadSampleJson = () => {
    const blob = new Blob([JSON.stringify(SAMPLE_PAPER_TEMPLATE, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mcq_paper_50_questions_template.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLoadSampleTemplate = () => {
    const text = JSON.stringify(SAMPLE_PAPER_TEMPLATE, null, 2);
    setUploadName(SAMPLE_PAPER_TEMPLATE.name);
    setUploadYear(SAMPLE_PAPER_TEMPLATE.year);
    setUploadDuration(SAMPLE_PAPER_TEMPLATE.duration_minutes);
    setUploadDescription(SAMPLE_PAPER_TEMPLATE.description);
    handleValidateJson(text);
    toast.success('Loaded 50-question KaTeX template!');
  };

  const handleImportSubmit = async () => {
    if (!parsedPreview) {
      toast.error('Please provide valid JSON first.');
      return;
    }
    if (!uploadName.trim()) {
      toast.error('Please enter the Paper Name.');
      return;
    }
    if (!uploadYear || uploadYear < 1990 || uploadYear > 2100) {
      toast.error('Please enter a valid Year.');
      return;
    }
    if (!uploadDuration || uploadDuration < 1) {
      toast.error('Please set a valid test duration in minutes.');
      return;
    }

    setIsImporting(true);
    try {
      const payload = {
        ...parsedPreview.raw,
        name: uploadName.trim(),
        year: Number(uploadYear),
        duration_minutes: Number(uploadDuration),
        description: uploadDescription.trim(),
      };
      const { data } = await mcqService.importAdminPaper(payload);
      toast.success(`Paper "${data.name} (${data.year})" uploaded with ${data.question_count} questions! Now you can upload images for questions and options.`);
      setUploadJsonText('');
      setParsedPreview(null);
      setUploadName('');
      setUploadDescription('');
      await fetchPapers();
      // Open the newly imported paper directly so admin can upload images right away
      setActivePaper(data);
      setSubView('questions');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to import MCQ paper.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleDeletePaper = async (id: string, name: string) => {
    if (!confirm(`Delete MCQ Paper "${name}" and all its questions?`)) return;
    try {
      await mcqService.deleteAdminPaper(id);
      toast.success('MCQ Paper deleted');
      fetchPapers();
    } catch {
      toast.error('Failed to delete paper');
    }
  };

  const handleOpenPaperMetaEdit = (paper: any) => {
    setEditingPaperMeta(paper);
    setPaperMetaForm({
      name: paper.name,
      year: paper.year,
      duration_minutes: paper.duration_minutes,
      description: paper.description || '',
      is_active: !!paper.is_active,
      is_free: !!paper.is_free,
    });
  };

  const handleSavePaperMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPaperMeta) return;
    setSavingPaperMeta(true);
    try {
      await mcqService.updateAdminPaper(editingPaperMeta.id, paperMetaForm);
      toast.success('Paper settings updated!');
      setEditingPaperMeta(null);
      fetchPapers();
      if (activePaper?.id === editingPaperMeta.id) {
        refreshActivePaper();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to update paper');
    } finally {
      setSavingPaperMeta(false);
    }
  };

  // Direct Image Upload / Removal Handler for Question or any of the 4 Options
  const handleDirectImageUpload = async (
    questionId: string,
    fieldName: 'image' | 'option_a_image' | 'option_b_image' | 'option_c_image' | 'option_d_image',
    file: File | null,
    remove = false
  ) => {
    const key = `${questionId}-${fieldName}`;
    setUploadingImageKey(key);
    try {
      const formData = new FormData();
      if (remove) {
        formData.append(`remove_${fieldName}`, 'true');
      } else if (file) {
        formData.append(fieldName, file);
      }
      const { data: updatedQ } = await mcqService.updateAdminQuestion(questionId, formData);
      toast.success(remove ? 'Image removed' : 'Image uploaded!');

      // Update activePaper state in-place for instant feedback
      setActivePaper((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          questions: prev.questions.map((q: any) => (q.id === questionId ? updatedQ : q)),
        };
      });
      if (editingQuestion?.id === questionId) {
        setEditingQuestion(updatedQ);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Image upload failed');
    } finally {
      setUploadingImageKey(null);
    }
  };

  const handleOpenEditQuestion = (q: any) => {
    const opts = Array.isArray(q.options) ? [...q.options] : ['', '', '', ''];
    while (opts.length < 4) opts.push('');
    setEditingQuestion(q);
    setQForm({
      order: q.order,
      text: q.text || '',
      options: opts.slice(0, 4),
      correct_option_index: q.correct_option_index ?? 0,
      explanation: q.explanation || '',
    });
  };

  const handleSaveQuestionEdit = async () => {
    if (!editingQuestion) return;
    setSavingQuestion(true);
    try {
      const payload = {
        order: Number(qForm.order),
        text: qForm.text,
        options: qForm.options,
        correct_option_index: Number(qForm.correct_option_index),
        explanation: qForm.explanation,
      };
      const { data: updatedQ } = await mcqService.updateAdminQuestion(editingQuestion.id, payload);
      toast.success(`Question #${updatedQ.order} saved!`);
      setEditingQuestion(null);
      setActivePaper((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          questions: prev.questions.map((q: any) => (q.id === updatedQ.id ? updatedQ : q)),
        };
      });
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to save question');
    } finally {
      setSavingQuestion(false);
    }
  };

  const handleOpenBulkJson = async (paperId: string) => {
    setJsonModalPaperId(paperId);
    setLoadingPaperJson(true);
    setJsonModalText('');
    try {
      const { data } = await mcqService.exportAdminPaperJson(paperId);
      setJsonModalText(JSON.stringify(data, null, 2));
    } catch {
      toast.error('Failed to export paper JSON');
      setJsonModalPaperId(null);
    } finally {
      setLoadingPaperJson(false);
    }
  };

  const handleSaveBulkJson = async () => {
    if (!jsonModalPaperId) return;
    let parsed: any;
    try {
      parsed = JSON.parse(jsonModalText);
    } catch (e: any) {
      toast.error('Invalid JSON: ' + e.message);
      return;
    }
    setSavingPaperJson(true);
    try {
      const { data } = await mcqService.updateAdminPaperJson(jsonModalPaperId, parsed);
      toast.success('Paper JSON updated (existing images preserved)!');
      setJsonModalPaperId(null);
      fetchPapers();
      if (activePaper?.id === jsonModalPaperId) {
        setActivePaper(data);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to update paper JSON');
    } finally {
      setSavingPaperJson(false);
    }
  };

  const filteredQuestions = (activePaper?.questions || []).filter((q: any) => {
    const hasAnyImg = !!(q.image || (q.option_images && q.option_images.some(Boolean)));
    if (questionFilter === 'with_images' && !hasAnyImg) return false;
    if (questionFilter === 'without_images' && hasAnyImg) return false;
    if (questionSearch.trim()) {
      const term = questionSearch.toLowerCase();
      const matchText = q.text?.toLowerCase().includes(term);
      const matchOrder = String(q.order) === term.replace('#', '');
      const matchOpt = (q.options || []).some((o: string) => o?.toLowerCase().includes(term));
      return matchText || matchOrder || matchOpt;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Sub-navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-dark-900 border border-dark-800 rounded-2xl p-5">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-neb-400" />
            Secure MCQ Past Papers &amp; Tests Management
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Upload 50-question papers via JSON (with KaTeX math support &amp; explanations), then attach optional images per question or per option.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setSubView('list')}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5',
              subView === 'list'
                ? 'bg-neb-600 text-white shadow-lg'
                : 'bg-dark-950 text-gray-400 hover:text-white border border-dark-800'
            )}
          >
            <FileText className="h-3.5 w-3.5" /> All Papers ({papers.length})
          </button>
          <button
            type="button"
            onClick={() => setSubView('upload')}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5',
              subView === 'upload'
                ? 'bg-neb-600 text-white shadow-lg'
                : 'bg-dark-950 text-gray-400 hover:text-white border border-dark-800'
            )}
          >
            <Upload className="h-3.5 w-3.5" /> Upload Paper JSON
          </button>
        </div>
      </div>

      {/* ─── VIEW 1: UPLOAD PAPER JSON ─── */}
      {subView === 'upload' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Paper Metadata + JSON Input */}
          <div className="lg:col-span-7 bg-dark-900 border border-dark-800 rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-dark-800 pb-4 flex-wrap gap-2">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Upload className="h-4 w-4 text-neb-400" /> Upload 50-Question MCQ Paper (JSON)
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Images are not included in the JSON — upload them easily in the question manager right after importing.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleLoadSampleTemplate}
                  className="px-3 py-1.5 rounded-lg bg-neb-950/60 hover:bg-neb-900/60 border border-neb-800/50 text-neb-300 text-xs font-bold transition"
                >
                  Load 50-Q Sample
                </button>
                <button
                  type="button"
                  onClick={handleDownloadSampleJson}
                  className="px-3 py-1.5 rounded-lg bg-dark-950 hover:bg-dark-800 border border-dark-700 text-gray-300 text-xs font-semibold flex items-center gap-1 transition"
                >
                  <Download className="h-3.5 w-3.5" /> JSON Template
                </button>
              </div>
            </div>

            {/* Paper Metadata Inputs (Name, Year, Duration) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1.5 block">
                  Paper Name *
                </label>
                <input
                  type="text"
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  placeholder="e.g. GCE A/L Computer Science Paper 1"
                  className="w-full bg-dark-950 border border-dark-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-neb-600"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1.5 block">
                  Paper Year *
                </label>
                <input
                  type="number"
                  value={uploadYear}
                  onChange={(e) => setUploadYear(Number(e.target.value))}
                  placeholder="2024"
                  className="w-full bg-dark-950 border border-dark-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-neb-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1.5 flex items-center gap-1">
                  <Clock className="h-3 w-3 text-neb-400" /> Test Duration (Minutes) *
                </label>
                <input
                  type="number"
                  min={1}
                  max={360}
                  value={uploadDuration}
                  onChange={(e) => setUploadDuration(Number(e.target.value))}
                  className="w-full bg-dark-950 border border-dark-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-neb-600"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1.5 block">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="Short description or instructions for students..."
                  className="w-full bg-dark-950 border border-dark-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-neb-600"
                />
              </div>
            </div>

            {/* File Picker + Raw JSON Textarea */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                  Questions JSON (Supports KaTeX $...$ and $$...$$)
                </label>
                <label className="cursor-pointer text-xs font-bold text-neb-400 hover:text-neb-300 flex items-center gap-1">
                  <Upload className="h-3.5 w-3.5" /> Choose .json file
                  <input type="file" accept=".json" onChange={handleJsonFileSelect} className="hidden" />
                </label>
              </div>
              <textarea
                value={uploadJsonText}
                onChange={(e) => handleValidateJson(e.target.value)}
                rows={12}
                spellCheck={false}
                placeholder={`{\n  "name": "Computer Science Paper 1",\n  "year": 2024,\n  "duration_minutes": 90,\n  "questions": [\n    {\n      "order": 1,\n      "text": "What is $\\\\log_2(64)$?",\n      "options": ["$4$", "$5$", "$6$", "$8$"],\n      "correct_option": "C",\n      "explanation": "Since $2^6 = 64$, $\\\\log_2(64) = 6$."\n    }\n  ]\n}`}
                className="w-full bg-dark-950 border border-dark-800 rounded-xl p-4 text-xs font-mono text-gray-200 focus:outline-none focus:border-neb-600 leading-relaxed"
              />
            </div>

            {parseError && (
              <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-800/40 text-red-300 text-xs flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <span>{parseError}</span>
              </div>
            )}

            {parsedPreview && (
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/40 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-white">
                      JSON Validated — {parsedPreview.questionCount} Questions Ready
                      {parsedPreview.questionCount === 50 && (
                        <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-900/60 text-emerald-300 text-[10px]">
                          <CheckCircle2 className="h-3 w-3" /> Standard 50 Questions
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      Duration: {uploadDuration} mins • Year: {uploadYear}
                    </p>
                  </div>
                </div>
                <Button onClick={handleImportSubmit} isLoading={isImporting} className="bg-neb-600 hover:bg-neb-500 text-xs px-5 py-2.5">
                  Import Paper Now
                </Button>
              </div>
            )}
          </div>

          {/* Right: Live KaTeX Preview of Question #1 */}
          <div className="lg:col-span-5 bg-dark-900 border border-dark-800 rounded-2xl p-6 flex flex-col">
            <h3 className="text-sm font-bold text-white border-b border-dark-800 pb-3 mb-4 flex items-center gap-2">
              <Eye className="h-4 w-4 text-neb-400" /> Live KaTeX Preview (Question #1)
            </h3>
            {parsedPreview?.sampleQuestion ? (
              <div className="space-y-4 flex-1">
                <div className="p-4 rounded-xl bg-dark-950 border border-dark-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neb-400">Question 1</span>
                  <div className="mt-2 text-sm text-white">
                    <KatexRenderer content={parsedPreview.sampleQuestion.text || parsedPreview.sampleQuestion.question} />
                  </div>
                </div>
                <div className="space-y-2">
                  {(parsedPreview.sampleQuestion.options || []).slice(0, 4).map((opt: any, idx: number) => {
                    const optText = typeof opt === 'object' ? opt.text : String(opt);
                    const letter = ['A', 'B', 'C', 'D'][idx];
                    return (
                      <div key={idx} className="p-3 rounded-xl bg-dark-950 border border-dark-800 flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-dark-800 text-gray-300 text-xs font-bold flex items-center justify-center shrink-0">
                          {letter}
                        </span>
                        <div className="text-xs text-gray-200 flex-1">
                          <KatexRenderer content={optText} inline />
                        </div>
                      </div>
                    );
                  })}
                </div>
                {(parsedPreview.sampleQuestion.explanation || parsedPreview.sampleQuestion.reason) && (
                  <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-800/30">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">
                      Explanation Preview
                    </span>
                    <div className="text-xs text-gray-200">
                      <KatexRenderer content={parsedPreview.sampleQuestion.explanation || parsedPreview.sampleQuestion.reason} />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-500 text-xs">
                <HelpCircle className="h-10 w-10 text-dark-700 mb-3" />
                <p>Paste or upload your paper JSON on the left (or click &ldquo;Load 50-Q Sample&rdquo;) to preview KaTeX rendering here.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── VIEW 2: PAPERS LIST ─── */}
      {subView === 'list' && (
        <div className="space-y-4">
          {loading ? (
            <div className="p-12 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neb-500" />
            </div>
          ) : papers.length === 0 ? (
            <div className="bg-dark-900 border border-dark-800 rounded-2xl p-12 text-center">
              <FileText className="h-12 w-12 text-gray-600 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white">No MCQ Papers Uploaded Yet</h3>
              <p className="text-gray-400 text-xs mt-1 mb-5 max-w-md mx-auto">
                Upload a 50-question MCQ paper in JSON format, set its duration, and add optional question or option images.
              </p>
              <Button onClick={() => setSubView('upload')} className="bg-neb-600 hover:bg-neb-500 text-xs">
                <Upload className="h-4 w-4 mr-1.5" /> Upload First MCQ Paper
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {papers.map((paper) => (
                <div
                  key={paper.id}
                  className="bg-dark-900 border border-dark-800 hover:border-dark-700 rounded-2xl p-5 flex flex-col justify-between gap-4 transition shadow-lg"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-neb-950 border border-neb-700/50 text-neb-400 flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> {paper.year}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-dark-950 border border-dark-800 text-gray-300 flex items-center gap-1">
                            <Clock className="h-3 w-3 text-amber-400" /> {paper.duration_minutes} mins
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-dark-950 border border-dark-800 text-emerald-400">
                            {paper.question_count} Questions
                          </span>
                          {!paper.is_active && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-950 text-red-400">
                              Hidden
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-bold text-white">{paper.name}</h3>
                        {paper.description && (
                          <p className="text-xs text-gray-400 mt-1 line-clamp-2">{paper.description}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-dark-800 flex-wrap gap-2">
                    <span className="text-[11px] text-gray-500">
                      {paper.attempts_count || 0} student attempt{paper.attempts_count === 1 ? '' : 's'}
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => openPaperQuestions(paper.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-neb-600 hover:bg-neb-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md"
                      >
                        <ImageIcon className="h-3.5 w-3.5" /> Questions &amp; Images
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenPaperMetaEdit(paper)}
                        className="p-2 rounded-xl bg-dark-950 hover:bg-dark-800 text-gray-300 border border-dark-800 transition"
                        title="Edit Paper Name, Year & Duration"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenBulkJson(paper.id)}
                        className="p-2 rounded-xl bg-dark-950 hover:bg-dark-800 text-gray-300 border border-dark-800 transition"
                        title="Edit Paper JSON"
                      >
                        <Code2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePaper(paper.id, paper.name)}
                        className="p-2 rounded-xl bg-dark-950 hover:bg-red-950/50 text-red-400 border border-dark-800 transition"
                        title="Delete Paper"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── VIEW 3: MANAGE 50 QUESTIONS & UPLOAD IMAGES ─── */}
      {subView === 'questions' && (
        <div className="space-y-5">
          {paperDetailLoading || !activePaper ? (
            <div className="p-16 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neb-500" />
            </div>
          ) : (
            <>
              {/* Paper Header Bar */}
              <div className="bg-dark-900 border border-dark-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => setSubView('list')}
                    className="p-2 rounded-xl bg-dark-950 hover:bg-dark-800 text-gray-300 border border-dark-800 mt-0.5"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-neb-950 text-neb-400 border border-neb-800/50">
                        {activePaper.year}
                      </span>
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-dark-950 text-amber-400 border border-dark-800">
                        {activePaper.duration_minutes} mins
                      </span>
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-dark-950 text-emerald-400 border border-dark-800">
                        {activePaper.questions?.length || 0} Questions
                      </span>
                    </div>
                    <h3 className="text-lg font-extrabold text-white mt-1">{activePaper.name}</h3>
                    <p className="text-xs text-gray-400">
                      Upload optional images for any question or any of its 4 options below, or edit KaTeX text &amp; explanations.
                    </p>
                  </div>
                </div>

                {/* Search & Filter */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="h-3.5 w-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={questionSearch}
                      onChange={(e) => setQuestionSearch(e.target.value)}
                      placeholder="Search Q# or text..."
                      className="bg-dark-950 border border-dark-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-neb-600"
                    />
                  </div>
                  <select
                    value={questionFilter}
                    onChange={(e) => setQuestionFilter(e.target.value as any)}
                    className="bg-dark-950 border border-dark-800 rounded-xl px-3 py-1.5 text-xs text-gray-200 focus:outline-none"
                  >
                    <option value="all">All Questions ({activePaper.questions?.length || 0})</option>
                    <option value="with_images">Has Images</option>
                    <option value="without_images">No Images</option>
                  </select>
                </div>
              </div>

              {/* Quick Question Number Jump Bar (1..50) */}
              <div className="bg-dark-900 border border-dark-800 rounded-2xl p-3 flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
                <span className="text-[10px] uppercase font-bold text-gray-500 px-2 shrink-0">Jump to:</span>
                {(activePaper.questions || []).map((q: any) => {
                  const hasImg = !!(q.image || (q.option_images && q.option_images.some(Boolean)));
                  return (
                    <a
                      key={q.id}
                      href={`#admin-mcq-q-${q.order}`}
                      className={cn(
                        'w-8 h-8 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 border transition relative',
                        hasImg
                          ? 'bg-emerald-950/50 border-emerald-700/60 text-emerald-300'
                          : 'bg-dark-950 border-dark-800 text-gray-300 hover:border-neb-600 hover:text-white'
                      )}
                      title={hasImg ? `Question #${q.order} (has image)` : `Question #${q.order}`}
                    >
                      {q.order}
                    </a>
                  );
                })}
              </div>

              {/* Questions List */}
              <div className="space-y-4">
                {filteredQuestions.map((q: any) => {
                  const optionFields: Array<{
                    idx: number;
                    letter: string;
                    field: 'option_a_image' | 'option_b_image' | 'option_c_image' | 'option_d_image';
                  }> = [
                    { idx: 0, letter: 'A', field: 'option_a_image' },
                    { idx: 1, letter: 'B', field: 'option_b_image' },
                    { idx: 2, letter: 'C', field: 'option_c_image' },
                    { idx: 3, letter: 'D', field: 'option_d_image' },
                  ];

                  return (
                    <div
                      key={q.id}
                      id={`admin-mcq-q-${q.order}`}
                      className="bg-dark-900 border border-dark-800 rounded-2xl p-5 space-y-4 scroll-mt-20"
                    >
                      {/* Question Top Row */}
                      <div className="flex items-start justify-between gap-3 border-b border-dark-800 pb-3 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 rounded-lg bg-neb-600 text-white text-xs font-extrabold">
                            Q{q.order}
                          </span>
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-800/40 text-emerald-300 text-xs font-bold">
                            Correct Option: {['A', 'B', 'C', 'D'][q.correct_option_index] || 'A'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Upload Question Image Button */}
                          <label className="cursor-pointer px-3 py-1.5 rounded-xl bg-dark-950 hover:bg-dark-800 border border-dark-700 text-xs font-semibold text-neb-300 flex items-center gap-1.5 transition">
                            <ImageIcon className="h-3.5 w-3.5" />
                            {uploadingImageKey === `${q.id}-image`
                              ? 'Uploading...'
                              : q.image
                                ? 'Change Question Image'
                                : 'Add Question Image'}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={uploadingImageKey === `${q.id}-image`}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleDirectImageUpload(q.id, 'image', file, false);
                                e.target.value = '';
                              }}
                            />
                          </label>

                          {q.image && (
                            <button
                              type="button"
                              onClick={() => handleDirectImageUpload(q.id, 'image', null, true)}
                              className="px-2.5 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/50 border border-red-800/40 text-red-300 text-xs font-semibold transition"
                            >
                              Remove Image
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenEditQuestion(q)}
                            className="px-3 py-1.5 rounded-xl bg-neb-950/60 hover:bg-neb-900 border border-neb-800/50 text-white text-xs font-bold flex items-center gap-1.5 transition"
                          >
                            <Edit className="h-3.5 w-3.5" /> Edit KaTeX / Text
                          </button>
                        </div>
                      </div>

                      {/* Question Text & Image */}
                      <div className="space-y-3">
                        <div className="text-sm text-gray-100 bg-dark-950/70 p-4 rounded-xl border border-dark-850">
                          <KatexRenderer content={q.text} />
                        </div>

                        {q.image && (
                          <div className="p-3 bg-dark-950 border border-dark-800 rounded-xl inline-block">
                            <p className="text-[10px] uppercase font-bold text-gray-500 mb-1.5">Question Image:</p>
                            <img
                              src={q.image}
                              alt={`Question ${q.order}`}
                              className="max-h-56 rounded-lg object-contain border border-dark-800"
                            />
                          </div>
                        )}
                      </div>

                      {/* 4 Options Grid with Per-Option Image Upload */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {optionFields.map(({ idx, letter, field }) => {
                          const isCorrect = q.correct_option_index === idx;
                          const optText = (q.options || [])[idx] || '';
                          const optImg = (q.option_images || [])[idx] || q[field] || null;
                          const isUploadingOpt = uploadingImageKey === `${q.id}-${field}`;

                          return (
                            <div
                              key={letter}
                              className={cn(
                                'p-3.5 rounded-xl border flex flex-col justify-between gap-3',
                                isCorrect
                                  ? 'bg-emerald-950/20 border-emerald-700/50'
                                  : 'bg-dark-950/60 border-dark-800'
                              )}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                                  <span
                                    className={cn(
                                      'w-6 h-6 rounded-full text-xs font-extrabold flex items-center justify-center shrink-0 mt-0.5',
                                      isCorrect ? 'bg-emerald-600 text-white' : 'bg-dark-800 text-gray-300'
                                    )}
                                  >
                                    {letter}
                                  </span>
                                  <div className="text-xs text-gray-200 flex-1 min-w-0">
                                    <KatexRenderer content={optText} inline />
                                  </div>
                                </div>

                                {/* Per-Option Image Upload Button */}
                                <div className="flex items-center gap-1 shrink-0">
                                  <label
                                    className="cursor-pointer px-2 py-1 rounded-lg bg-dark-900 hover:bg-dark-800 border border-dark-700 text-[10px] font-semibold text-gray-300 hover:text-white flex items-center gap-1 transition"
                                    title={`Upload image for Option ${letter}`}
                                  >
                                    <ImageIcon className="h-3 w-3 text-neb-400" />
                                    <span>{isUploadingOpt ? '...' : optImg ? 'Change Img' : '+ Image'}</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      disabled={isUploadingOpt}
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleDirectImageUpload(q.id, field, file, false);
                                        e.target.value = '';
                                      }}
                                    />
                                  </label>
                                  {optImg && (
                                    <button
                                      type="button"
                                      onClick={() => handleDirectImageUpload(q.id, field, null, true)}
                                      className="p-1 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-800/30"
                                      title={`Remove Option ${letter} image`}
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  )}
                                </div>
                              </div>

                              {optImg && (
                                <div className="pl-8">
                                  <img
                                    src={optImg}
                                    alt={`Option ${letter}`}
                                    className="max-h-36 rounded-lg object-contain border border-dark-800 bg-dark-900 p-1"
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation */}
                      {q.explanation && (
                        <div className="p-3.5 rounded-xl bg-amber-950/15 border border-amber-800/30">
                          <span className="text-[10px] uppercase font-extrabold tracking-wider text-amber-400 block mb-1">
                            Explanation (KaTeX)
                          </span>
                          <div className="text-xs text-gray-200">
                            <KatexRenderer content={q.explanation} />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ─── MODAL: EDIT PAPER METADATA ─── */}
      {editingPaperMeta && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-sm">
          <form
            onSubmit={handleSavePaperMeta}
            className="w-full max-w-md bg-dark-900 border border-dark-800 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between p-5 border-b border-dark-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Edit className="h-4 w-4 text-neb-400" /> Edit Paper Settings
              </h3>
              <button type="button" onClick={() => setEditingPaperMeta(null)} className="text-gray-500 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Paper Name</label>
                <input
                  type="text"
                  required
                  value={paperMetaForm.name}
                  onChange={(e) => setPaperMetaForm({ ...paperMetaForm, name: e.target.value })}
                  className="w-full bg-dark-950 border border-dark-800 rounded-xl px-3.5 py-2 text-sm text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Year</label>
                  <input
                    type="number"
                    required
                    value={paperMetaForm.year}
                    onChange={(e) => setPaperMetaForm({ ...paperMetaForm, year: Number(e.target.value) })}
                    className="w-full bg-dark-950 border border-dark-800 rounded-xl px-3.5 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Duration (mins)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={paperMetaForm.duration_minutes}
                    onChange={(e) => setPaperMetaForm({ ...paperMetaForm, duration_minutes: Number(e.target.value) })}
                    className="w-full bg-dark-950 border border-dark-800 rounded-xl px-3.5 py-2 text-sm text-white"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Description</label>
                <textarea
                  rows={3}
                  value={paperMetaForm.description}
                  onChange={(e) => setPaperMetaForm({ ...paperMetaForm, description: e.target.value })}
                  className="w-full bg-dark-950 border border-dark-800 rounded-xl px-3.5 py-2 text-xs text-white"
                />
              </div>
              <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={paperMetaForm.is_active}
                  onChange={(e) => setPaperMetaForm({ ...paperMetaForm, is_active: e.target.checked })}
                  className="rounded border-dark-700"
                />
                Visible to students
              </label>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-dark-800">
              <button
                type="button"
                onClick={() => setEditingPaperMeta(null)}
                className="px-4 py-2 rounded-xl text-xs text-gray-400 hover:text-white border border-dark-800"
              >
                Cancel
              </button>
              <Button type="submit" isLoading={savingPaperMeta} className="bg-neb-600 hover:bg-neb-500 text-xs px-5 py-2">
                Save Settings
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* ─── MODAL: EDIT QUESTION (KATEX + LIVE PREVIEW + IMAGES) ─── */}
      {editingQuestion && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-dark-950/85 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-6xl bg-dark-900 border border-dark-800 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-dark-800 bg-dark-950/40 shrink-0">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Edit className="h-4 w-4 text-neb-400" />
                  Edit Question #{qForm.order} (KaTeX &amp; Images)
                </h3>
                <p className="text-[11px] text-gray-500">
                  Use <code className="text-neb-400">$...$</code> for inline math and <code className="text-neb-400">$$...$$</code> for block equations.
                </p>
              </div>
              <button type="button" onClick={() => setEditingQuestion(null)} className="text-gray-500 hover:text-white p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-dark-800">
              {/* Left Column: Editor Inputs */}
              <div className="lg:col-span-6 p-6 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="w-28">
                    <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Question #</label>
                    <input
                      type="number"
                      value={qForm.order}
                      onChange={(e) => setQForm({ ...qForm, order: Number(e.target.value) })}
                      className="w-full bg-dark-950 border border-dark-800 rounded-xl px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Correct Option</label>
                    <div className="grid grid-cols-4 gap-2">
                      {['A', 'B', 'C', 'D'].map((letter, idx) => (
                        <button
                          key={letter}
                          type="button"
                          onClick={() => setQForm({ ...qForm, correct_option_index: idx })}
                          className={cn(
                            'py-2 rounded-xl text-xs font-extrabold border transition',
                            qForm.correct_option_index === idx
                              ? 'bg-emerald-600 border-emerald-500 text-white shadow-md'
                              : 'bg-dark-950 border-dark-800 text-gray-400 hover:text-white'
                          )}
                        >
                          Option {letter}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                    Question Text (Markdown &amp; KaTeX)
                  </label>
                  <textarea
                    rows={4}
                    value={qForm.text}
                    onChange={(e) => setQForm({ ...qForm, text: e.target.value })}
                    className="w-full bg-dark-950 border border-dark-800 rounded-xl p-3 text-xs font-mono text-white focus:outline-none focus:border-neb-600"
                    placeholder="Enter question text with KaTeX e.g. $f(x) = x^2$..."
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] uppercase font-bold text-gray-400 block">
                    4 Answer Options (KaTeX supported)
                  </label>
                  {['A', 'B', 'C', 'D'].map((letter, idx) => (
                    <div key={letter} className="flex items-center gap-2">
                      <span
                        className={cn(
                          'w-7 h-7 rounded-lg text-xs font-extrabold flex items-center justify-center shrink-0',
                          qForm.correct_option_index === idx
                            ? 'bg-emerald-600 text-white'
                            : 'bg-dark-800 text-gray-400'
                        )}
                      >
                        {letter}
                      </span>
                      <input
                        type="text"
                        value={qForm.options[idx] || ''}
                        onChange={(e) => {
                          const next = [...qForm.options];
                          next[idx] = e.target.value;
                          setQForm({ ...qForm, options: next });
                        }}
                        placeholder={`Option ${letter} text (supports $math$)...`}
                        className="flex-1 bg-dark-950 border border-dark-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-neb-600"
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                    Explanation of Correct Answer (Markdown &amp; KaTeX)
                  </label>
                  <textarea
                    rows={4}
                    value={qForm.explanation}
                    onChange={(e) => setQForm({ ...qForm, explanation: e.target.value })}
                    className="w-full bg-dark-950 border border-dark-800 rounded-xl p-3 text-xs font-mono text-white focus:outline-none focus:border-neb-600"
                    placeholder="Explain clearly why the correct option is right..."
                  />
                </div>
              </div>

              {/* Right Column: Live KaTeX Preview */}
              <div className="lg:col-span-6 p-6 bg-dark-950/50 space-y-4">
                <div className="flex items-center justify-between border-b border-dark-800 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-neb-400 flex items-center gap-1.5">
                    <Eye className="h-4 w-4" /> Real-Time KaTeX Render Preview
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-dark-900 border border-dark-800 space-y-3">
                  <span className="text-[10px] font-extrabold uppercase text-neb-400">Question {qForm.order}</span>
                  <div className="text-sm text-white">
                    <KatexRenderer content={qForm.text || '*Type question text...*'} />
                  </div>
                  {editingQuestion.image && (
                    <img src={editingQuestion.image} alt="Q" className="max-h-40 rounded-lg border border-dark-800" />
                  )}
                </div>

                <div className="space-y-2">
                  {['A', 'B', 'C', 'D'].map((letter, idx) => {
                    const isCorrect = qForm.correct_option_index === idx;
                    const optImg = (editingQuestion.option_images || [])[idx];
                    return (
                      <div
                        key={letter}
                        className={cn(
                          'p-3 rounded-xl border flex flex-col gap-2',
                          isCorrect ? 'bg-emerald-950/30 border-emerald-600/60' : 'bg-dark-900 border-dark-800'
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className={cn(
                              'w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0',
                              isCorrect ? 'bg-emerald-600 text-white' : 'bg-dark-800 text-gray-400'
                            )}
                          >
                            {letter}
                          </span>
                          <div className="text-xs text-gray-100 flex-1">
                            <KatexRenderer content={qForm.options[idx] || `*Option ${letter}*`} inline />
                          </div>
                        </div>
                        {optImg && (
                          <img src={optImg} alt={letter} className="max-h-28 rounded-lg object-contain ml-8" />
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/30">
                  <span className="text-[10px] font-extrabold uppercase text-amber-400 block mb-1">
                    Explanation Preview
                  </span>
                  <div className="text-xs text-gray-200">
                    <KatexRenderer content={qForm.explanation || '*No explanation entered yet.*'} />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-dark-800 bg-dark-950/40 shrink-0">
              <button
                type="button"
                onClick={() => setEditingQuestion(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-400 hover:text-white border border-dark-800"
              >
                Cancel
              </button>
              <Button onClick={handleSaveQuestionEdit} isLoading={savingQuestion} className="bg-neb-600 hover:bg-neb-500 text-xs px-6 py-2">
                Save Question
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: BULK PAPER JSON EDITOR ─── */}
      {jsonModalPaperId && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-sm">
          <div className="w-full max-w-3xl bg-dark-900 border border-dark-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-dark-800">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Code2 className="h-4 w-4 text-neb-400" /> Edit MCQ Paper JSON
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Any images already uploaded for questions or options are automatically preserved by question order.
                </p>
              </div>
              <button type="button" onClick={() => setJsonModalPaperId(null)} className="text-gray-500 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 flex-1 overflow-hidden">
              {loadingPaperJson ? (
                <div className="py-16 flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neb-500" />
                </div>
              ) : (
                <textarea
                  value={jsonModalText}
                  onChange={(e) => setJsonModalText(e.target.value)}
                  className="w-full h-[55vh] bg-dark-950 border border-dark-800 rounded-xl p-4 text-xs font-mono text-gray-200 focus:outline-none focus:border-neb-600"
                  spellCheck={false}
                />
              )}
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-dark-800">
              <button
                type="button"
                onClick={() => setJsonModalPaperId(null)}
                className="px-4 py-2 rounded-xl text-xs text-gray-400 hover:text-white border border-dark-800"
              >
                Cancel
              </button>
              <Button onClick={handleSaveBulkJson} isLoading={savingPaperJson} className="bg-neb-600 hover:bg-neb-500 text-xs px-5 py-2">
                Save JSON
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
