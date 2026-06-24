'use client';
import { useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Terminal, RefreshCw, Info, Star, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { useMySQLLabStore } from '@/store/mysql-lab.store';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

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
  } = useMySQLLabStore();

  const isSubscribed = user?.is_subscribed || user?.is_staff;

  // Compute free-tier days used this month
  const currentMonthPrefix = new Date().toISOString().slice(0, 7);
  const labDays: string[] = user?.lab_access_days || [];
  const daysUsedThisMonth = labDays.filter((d: string) => d.startsWith(currentMonthPrefix)).length;
  const freeLimit = 2;

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
              ? <>You have used your <strong>2 free lab days</strong> for this month. Upgrade to continue using the MySQL Lab.</>
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
          {/* Terminal output */}
          <div
            ref={termRef}
            className="overflow-y-auto p-4 font-mono text-xs md:text-sm leading-relaxed bg-[#06060c] select-text h-[350px] md:h-[450px]"
            onClick={() => inputRef.current?.focus()}
          >
            {lines.length === 0 && !connected && (
              <div className="text-gray-500 italic text-xs">
                {isAuthenticated ? 'Connecting to MySQL…' : 'Please log in to use the MySQL Lab.'}
              </div>
            )}
            {lines.map((line, i) => (
              <div key={i} className={cn(
                "mb-1",
                line.type === 'input' ? 'text-neb-400 font-semibold' :
                  line.type === 'error' ? 'text-red-400 font-medium' :
                    line.type === 'system' ? 'text-yellow-500/80 italic text-xs' :
                      'text-green-300'
              )}>
                <pre className="whitespace-pre-wrap break-all font-mono text-xs md:text-[13px] leading-normal opacity-90">
                  {line.text}
                </pre>
              </div>
            ))}
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
                placeholder={connected ? 'Type SQL query (ends with ;)...' : 'Not connected'}
                disabled={!connected}
                className="flex-1 bg-transparent font-mono text-xs md:text-sm text-white placeholder-gray-700 outline-none caret-neb-400 resize-none min-h-[30px] max-h-[150px] py-1"
                spellCheck={false}
                autoCapitalize="none"
                autoCorrect="off"
                autoComplete="off"
                rows={1}
              />
            </div>
            {/* Actions Bar */}
            <div className="flex items-center justify-between px-4 pb-3">
              <div className="flex items-center gap-1">
                <button onClick={handleArrowUp} disabled={!connected || history.length === 0}
                  className="p-2 rounded bg-dark-800 hover:bg-dark-750 text-gray-400 disabled:opacity-20 active:scale-95 transition-all" title="Previous Command">
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24"><path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z" /></svg>
                </button>
                <button onClick={handleArrowDown} disabled={!connected || histIdx === -1}
                  className="p-2 rounded bg-dark-800 hover:bg-dark-750 text-gray-400 disabled:opacity-20 active:scale-95 transition-all" title="Next Command">
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z" /></svg>
                </button>
                <span className="text-[10px] text-gray-600 font-mono ml-1 hidden sm:inline">
                  {histIdx === -1 ? '' : `${histIdx + 1}/${history.length}`}
                </span>
              </div>
              <button onClick={onExecute} disabled={!connected || !input.trim()}
                className="px-5 py-2 rounded-lg bg-neb-600 hover:bg-neb-500 text-white text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shadow-lg shadow-neb-950/20 flex items-center gap-2">
                Execute <span className="opacity-40 font-normal hidden sm:inline">↵</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Commands */}
        <div className="flex flex-col gap-3 order-first lg:order-last">
          <div className="card p-4 bg-dark-900/40 border-dark-800">
            <div className="flex items-center gap-2 mb-3">
              <Info className="h-4 w-4 text-neb-400" />
              <h3 className="text-sm font-semibold text-white">Quick Commands</h3>
            </div>
            <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
              {TIPS.map(tip => (
                <button key={tip} onClick={() => insertTip(tip)}
                  className="whitespace-nowrap text-left px-3 py-2 rounded-md bg-dark-800/80 hover:bg-dark-700 text-neb-300 font-mono text-[10px] md:text-xs transition-colors border border-dark-700/50">
                  {tip}
                </button>
              ))}
            </div>
          </div>
          <div className="card p-4 text-[10px] md:text-xs text-gray-400 leading-relaxed hidden md:block border-dark-800">
            <p className="font-semibold text-gray-300 mb-2">Tips</p>
            <p>↑ ↓ arrows to navigate history</p>
            <p className="mt-1">Session resets after 15 min of inactivity</p>
            <p className="mt-1 text-neb-500/80 font-medium">Safe Sandbox Isolation Active</p>
          </div>
        </div>
      </div>
      <div className="h-20 md:hidden"></div>
    </div>
  );
}

export default function MySQLLabPage() {
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