'use client';
import { useEffect, useRef, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Terminal, RefreshCw, Info, Star, ArrowLeft, Copy, Check, ClipboardPaste, Trash2, History } from 'lucide-react';
import { cn, copyToClipboard } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { useMySQLLabStore } from '@/store/mysql-lab.store';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import toast from 'react-hot-toast';

const TIPS = [
  'CREATE DATABASE school;',
  'USE school;',
  'CREATE TABLE students (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100));',
  'INSERT INTO students (name) VALUES ("Alice"), ("Bob");',
  'SELECT * FROM students;',
  'SHOW DATABASES;',
  'SHOW TABLES;',
];

export const dynamic = 'force-dynamic';

function MySQLLabContent() {
  const { user, isAuthenticated } = useAuthStore();
  const searchParams = useSearchParams();
  const router = useRouter();
  const courseId = searchParams.get('courseId');
  const lessonId = searchParams.get('lessonId');

  const termRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const {
    connected,
    connecting,
    lines,
    history,
    histIdx,
    input,
    setInput,
    connect,
    disconnect,
    sendCommand,
    handleArrowUp,
    handleArrowDown,
    clearLines,
  } = useMySQLLabStore();

  const isSubscribed = user?.is_subscribed || user?.is_staff;

  // Compute free-tier days used this month
  const currentMonthPrefix = new Date().toISOString().slice(0, 7);
  const labDays: string[] = user?.lab_access_days || [];
  const daysUsedThisMonth = labDays.filter((d: string) => d.startsWith(currentMonthPrefix)).length;
  const freeLimit = 3;

  useEffect(() => {
    if (isAuthenticated) connect();
  }, [isAuthenticated, connect]);

  useEffect(() => {
    const codeParam = searchParams.get('code');
    if (codeParam) {
      setInput(codeParam);
    }
  }, [searchParams, setInput]);

  useEffect(() => {
    if (termRef.current) {
      termRef.current.scrollTop = termRef.current.scrollHeight;
    }
  }, [lines]);

  const onExecute = () => {
    if (input.trim()) {
      sendCommand(input);
      if (inputRef.current) inputRef.current.style.height = 'auto';
    }
  };

  const insertTip = (cmd: string) => {
    setInput(cmd);
    inputRef.current?.focus();
    inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleCopyCommand = async (cmdText: string, id: string, label = 'Command copied!') => {
    const cleanCmd = cmdText.replace(/^mysql>\s*/i, '').trim();
    const ok = await copyToClipboard(cleanCmd);
    if (ok) {
      setCopiedId(id);
      toast.success(label);
      setTimeout(() => setCopiedId(prev => (prev === id ? null : prev)), 2000);
    } else {
      toast.error('Failed to copy');
    }
  };

  const handlePasteToInput = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setInput((input ? input + ' ' : '') + text);
          inputRef.current?.focus();
          toast.success('Pasted into command input!');
          return;
        }
      }
    } catch {
      // Fallback prompt
    }
    toast('Long-press inside the mysql> input box and tap Paste');
    inputRef.current?.focus();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 md:py-6 pb-24 animate-in fade-in duration-500">
      {/* Header */}
      {courseId && lessonId && (
        <Button
          variant="ghost"
          onClick={() => router.push(`/courses/${courseId}/lesson/${lessonId}`)}
          className="mb-4 text-gray-400 hover:text-white flex items-center gap-2 px-0 hover:bg-transparent"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Lesson
        </Button>
      )}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="font-bold text-2xl text-white flex items-center gap-2">
            <Terminal className="h-6 w-6 text-neb-400" /> MySQL Lab
          </h1>
          <p className="text-gray-400 text-xs mt-1">Live MySQL 8.0 container — your personal database environment</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={connected ? 'success' : 'warning'} className="text-xs py-1 px-2.5">
            {connected ? '● Connected' : connecting ? '◌ Connecting…' : '○ Disconnected'}
          </Badge>
          <Button variant="ghost" size="xs" onClick={connected ? disconnect : connect} isLoading={connecting} className="h-8 text-xs border border-dark-700 hover:bg-dark-800">
            <RefreshCw className="h-3 w-3 mr-1" /> {connected ? 'Reset' : 'Connect'}
          </Button>
        </div>
      </div>

      {/* Free-tier quota banner — hidden for premium/staff */}
      {!isSubscribed && (
        <div className={cn(
          "mb-4 px-4 py-3 rounded-xl border flex items-center gap-3 text-xs",
          daysUsedThisMonth >= freeLimit
            ? "bg-red-950/20 border-red-900/30 text-red-400"
            : "bg-amber-950/20 border-amber-900/30 text-amber-400"
        )}>
          <Star className="h-4 w-4 shrink-0" />
          <div className="flex-1">
            {daysUsedThisMonth >= freeLimit
              ? <>You have used your <strong>3 free lab days</strong> for this month. Upgrade to continue using the MySQL Lab.</>
              : <>Free plan: <strong>{freeLimit - daysUsedThisMonth} of {freeLimit} free day{freeLimit - daysUsedThisMonth !== 1 ? 's' : ''} remaining</strong> this month. Upgrade for unlimited access.</>
            }
          </div>
          <Link href="/pricing" className="shrink-0 px-3 py-1.5 rounded-lg bg-neb-600 hover:bg-neb-500 text-white font-bold transition-all active:scale-95">
            Upgrade ↗
          </Link>
        </div>
      )}

      <div className="flex flex-col lg:grid lg:grid-cols-4 gap-4">
        {/* Terminal Container */}
        <div className="lg:col-span-3 flex flex-col card overflow-hidden border-dark-800 bg-dark-900/40 backdrop-blur-sm shadow-2xl">
          {/* Terminal Top Bar */}
          <div className="flex items-center justify-between px-4 py-2 bg-dark-900 border-b border-dark-800 text-xs">
            <span className="text-gray-400 font-mono text-[11px]">mysql-8.0-interactive (tap any command to copy)</span>
            {lines.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const allCmds = lines
                      .filter(l => l.type === 'input')
                      .map(l => l.text.replace(/^mysql>\s*/i, '').trim())
                      .join('\n');
                    if (allCmds) handleCopyCommand(allCmds, 'copy-all-cmds', 'All SQL commands copied!');
                    else toast.error('No commands to copy yet');
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-dark-800 hover:bg-dark-700 text-gray-300 text-[10px] font-semibold border border-dark-700 transition"
                >
                  {copiedId === 'copy-all-cmds' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3 text-neb-400" />}
                  Copy All Commands
                </button>
                <button
                  type="button"
                  onClick={clearLines}
                  className="p-1 rounded bg-dark-800 hover:bg-dark-700 text-gray-400 hover:text-white border border-dark-700 transition"
                  title="Clear output"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>

          {/* Terminal output */}
          <div
            ref={termRef}
            className="overflow-y-auto p-4 font-mono text-xs md:text-sm leading-relaxed bg-[#06060c] select-text h-[350px] md:h-[450px] space-y-1.5"
            onClick={(e) => {
              // Do not steal focus if user is selecting text or clicking a button
              const selection = window.getSelection()?.toString();
              if (selection && selection.length > 0) return;
              if ((e.target as HTMLElement).closest('button')) return;
            }}
          >
            {lines.length === 0 && !connected && (
              <div className="text-gray-500 italic text-xs">
                {isAuthenticated ? 'Connecting to MySQL…' : 'Please log in to use the MySQL Lab.'}
              </div>
            )}
            {lines.map((line, i) => {
              const lineId = `line-${i}`;
              const isInput = line.type === 'input';
              const displayText = isInput
                ? (line.text.startsWith('mysql>') ? line.text : `mysql> ${line.text}`)
                : line.text;

              return (
                <div
                  key={i}
                  className={cn(
                    "group relative rounded-lg px-2.5 py-1.5 transition-colors flex items-start justify-between gap-2",
                    isInput
                      ? 'bg-emerald-950/20 border border-emerald-900/30 text-green-400 font-semibold'
                      : line.type === 'error'
                        ? 'bg-red-950/15 text-red-400 font-medium'
                        : line.type === 'system'
                          ? 'text-yellow-500/80 italic text-xs'
                          : 'text-green-300 hover:bg-white/[0.02]'
                  )}
                >
                  <pre className="whitespace-pre-wrap break-all font-mono text-xs md:text-[13px] leading-normal opacity-95 select-text flex-1">
                    {displayText}
                  </pre>

                  {(isInput || line.type === 'output') && (
                    <div className="flex items-center gap-1 shrink-0">
                      {isInput && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const clean = line.text.replace(/^mysql>\s*/i, '').trim();
                            setInput(clean);
                            inputRef.current?.focus();
                          }}
                          className="px-2 py-1 rounded bg-dark-800/90 hover:bg-dark-700 text-gray-300 text-[10px] font-sans font-semibold border border-dark-700 transition active:scale-95"
                          title="Load into input"
                        >
                          Use
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyCommand(
                            line.text,
                            lineId,
                            isInput ? 'SQL command copied!' : 'Output copied!'
                          );
                        }}
                        className="flex items-center gap-1 px-2 py-1 rounded bg-dark-800/90 hover:bg-dark-700 text-gray-200 text-[10px] font-sans font-semibold border border-dark-700 transition active:scale-95"
                        title="Copy"
                      >
                        {copiedId === lineId ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3 text-neb-400" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Input Area */}
          <div className="border-t border-dark-800 bg-[#090910]">
            <div className="flex items-start px-4 py-3 gap-2">
              <span className="text-neb-400 font-mono text-xs md:text-sm shrink-0 mt-1">mysql&gt;</span>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => {
                  setInput(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowUp') { e.preventDefault(); handleArrowUp(); }
                  else if (e.key === 'ArrowDown') { e.preventDefault(); handleArrowDown(); }
                  else if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onExecute(); }
                }}
                placeholder={connected ? 'Type or paste SQL query (ends with ;)...' : 'Not connected'}
                disabled={!connected}
                className="flex-1 bg-transparent font-mono text-xs md:text-sm text-white placeholder-gray-700 outline-none caret-neb-400 resize-none min-h-[30px] max-h-[150px] py-1 select-text"
                spellCheck={false}
                autoCapitalize="none"
                autoCorrect="off"
                autoComplete="off"
                rows={1}
              />
            </div>
            {/* Actions Bar */}
            <div className="flex items-center justify-between px-4 pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={handleArrowUp}
                  disabled={!connected || history.length === 0}
                  className="p-2 rounded bg-dark-800 hover:bg-dark-750 text-gray-400 disabled:opacity-20 active:scale-95 transition-all"
                  title="Previous Command"
                >
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24"><path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z" /></svg>
                </button>
                <button
                  type="button"
                  onClick={handleArrowDown}
                  disabled={!connected || histIdx === -1}
                  className="p-2 rounded bg-dark-800 hover:bg-dark-750 text-gray-400 disabled:opacity-20 active:scale-95 transition-all"
                  title="Next Command"
                >
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z" /></svg>
                </button>
                <button
                  type="button"
                  onClick={() => input && handleCopyCommand(input, 'input-copy', 'Current command copied!')}
                  disabled={!input.trim()}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-dark-800 hover:bg-dark-700 text-gray-300 text-xs font-semibold border border-dark-700 disabled:opacity-30 active:scale-95 transition-all"
                  title="Copy current command"
                >
                  {copiedId === 'input-copy' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-neb-400" />}
                  <span>Copy</span>
                </button>
                <button
                  type="button"
                  onClick={handlePasteToInput}
                  disabled={!connected}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-dark-800 hover:bg-dark-700 text-gray-300 text-xs font-semibold border border-dark-700 disabled:opacity-30 active:scale-95 transition-all"
                  title="Paste command"
                >
                  <ClipboardPaste className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Paste</span>
                </button>
                <span className="text-[10px] text-gray-600 font-mono ml-1 hidden sm:inline">
                  {histIdx === -1 ? '' : `${histIdx + 1}/${history.length}`}
                </span>
              </div>
              <button
                type="button"
                onClick={onExecute}
                disabled={!connected || !input.trim()}
                className="px-5 py-2 rounded-lg bg-neb-600 hover:bg-neb-500 text-white text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shadow-lg shadow-neb-950/20 flex items-center gap-2"
              >
                Execute <span className="opacity-40 font-normal hidden sm:inline">↵</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Commands & Command History */}
        <div className="flex flex-col gap-3 order-first lg:order-last">
          <div className="card p-4 bg-dark-900/40 border-dark-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-neb-400" />
                <h3 className="text-sm font-semibold text-white">Quick Commands</h3>
              </div>
              <span className="text-[10px] text-gray-500">Tap to use or copy</span>
            </div>
            <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
              {TIPS.map((tip, idx) => {
                const tipId = `tip-${idx}`;
                return (
                  <div
                    key={tip}
                    className="flex items-center justify-between gap-1.5 rounded-lg bg-dark-800/80 hover:bg-dark-750 border border-dark-700/60 px-2.5 py-1.5 shrink-0 lg:shrink"
                  >
                    <button
                      type="button"
                      onClick={() => insertTip(tip)}
                      className="text-left text-neb-300 font-mono text-[10px] md:text-xs transition-colors flex-1 whitespace-nowrap lg:whitespace-normal break-all select-text"
                      title="Insert into terminal"
                    >
                      {tip}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopyCommand(tip, tipId)}
                      className="p-1.5 rounded bg-dark-900 hover:bg-dark-700 text-gray-300 hover:text-white border border-dark-700 shrink-0 active:scale-95 transition"
                      title="Copy command"
                    >
                      {copiedId === tipId ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5 text-gray-400" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {history.length > 0 && (
            <div className="card p-4 bg-dark-900/40 border-dark-800">
              <div className="flex items-center gap-2 mb-3">
                <History className="h-4 w-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">Recent Commands</h3>
              </div>
              <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
                {history.slice(0, 10).map((cmd, idx) => {
                  const hId = `hist-${idx}`;
                  return (
                    <div
                      key={hId}
                      className="flex items-center justify-between gap-1.5 rounded-lg bg-dark-800/60 border border-dark-700/50 px-2.5 py-1.5"
                    >
                      <button
                        type="button"
                        onClick={() => insertTip(cmd)}
                        className="text-left text-emerald-300 font-mono text-[11px] truncate flex-1 select-text"
                      >
                        {cmd}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopyCommand(cmd, hId)}
                        className="p-1 rounded bg-dark-900 hover:bg-dark-700 text-gray-300 border border-dark-700 shrink-0 active:scale-95"
                        title="Copy command"
                      >
                        {copiedId === hId ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="card p-4 text-[10px] md:text-xs text-gray-400 leading-relaxed hidden md:block border-dark-800">
            <p className="font-semibold text-gray-300 mb-2">Tips</p>
            <p>↑ ↓ arrows to navigate history</p>
            <p className="mt-1">Tap Copy next to any command to copy it to your clipboard</p>
            <p className="mt-1">Session resets after 15 min of inactivity</p>
          </div>
        </div>
      </div>
      <div className="h-20 md:hidden"></div>
    </div>
  );
}

export default function MySQLLabPageClient() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-[calc(100vh-56px)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neb-400"></div>
      </div>
    }>
      <MySQLLabContent />
    </Suspense>
  );
}
