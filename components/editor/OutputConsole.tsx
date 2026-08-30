'use client';
import { useState, useRef, useEffect } from 'react';
import { Terminal, CheckCircle2, XCircle, Clock, Trash2, Maximize2, Minimize2, AlertTriangle, Info as InfoIcon } from 'lucide-react';
import { useEditorStore } from '@/store/editor.store';
import { cn } from '@/lib/utils';

// ─── GCC error/warning parser ─────────────────────────────────────────────────

interface Diagnostic {
  file: string;
  line: string;
  col: string;
  level: 'error' | 'warning' | 'note' | 'info';
  message: string;
  snippet?: string[];   // source lines & carets from GCC output
}

function parseDiagnostics(stderr: string): { diagnostics: Diagnostic[]; rest: string } {
  if (!stderr) return { diagnostics: [], rest: '' };

  // GCC diagnostic line: file:line:col: level: message
  const diagLineRe = /^([^:\n]+):(\d+):(\d+):\s*(error|warning|note):\s*(.+)$/;
  const lines = stderr.split('\n');
  const diagnostics: Diagnostic[] = [];
  const restLines: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const m = lines[i].match(diagLineRe);
    if (m) {
      const diag: Diagnostic = {
        file: m[1],
        line: m[2],
        col: m[3],
        level: m[4] as Diagnostic['level'],
        message: m[5],
        snippet: [],
      };
      i++;
      // Collect snippet lines (lines that don't start a new diagnostic and aren't blank function markers)
      while (i < lines.length) {
        const nextMatch = lines[i].match(diagLineRe);
        if (nextMatch) break;
        // Skip "In function" type lines — add to snippet
        if (lines[i].trim() !== '' || diag.snippet!.length > 0) {
          // Don't attach "In function 'xyz':" to this diagnostic's snippet
          if (/^[^:]+: In /.test(lines[i])) { restLines.push(lines[i]); }
          else { diag.snippet!.push(lines[i]); }
        }
        i++;
      }
      // Remove trailing empty snippet lines
      while (diag.snippet!.length && diag.snippet![diag.snippet!.length - 1].trim() === '') {
        diag.snippet!.pop();
      }
      diagnostics.push(diag);
    } else {
      restLines.push(lines[i]);
      i++;
    }
  }

  return { diagnostics, rest: restLines.filter(l => l.trim()).join('\n') };
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function DiagnosticCard({ d }: { d: Diagnostic }) {
  const [expanded, setExpanded] = useState(true);

  const levelColor = {
    error:   { border: 'border-red-700/50',   bg: 'bg-red-950/30',   icon: 'text-red-400',    badge: 'bg-red-900/60 text-red-300' },
    warning: { border: 'border-yellow-700/40', bg: 'bg-yellow-950/20', icon: 'text-yellow-400', badge: 'bg-yellow-900/50 text-yellow-300' },
    note:    { border: 'border-blue-700/40',   bg: 'bg-blue-950/20',  icon: 'text-blue-400',   badge: 'bg-blue-900/50 text-blue-300' },
    info:    { border: 'border-gray-700/40',   bg: 'bg-gray-900/20',  icon: 'text-gray-400',   badge: 'bg-gray-800/50 text-gray-300' },
  }[d.level];

  const Icon = d.level === 'error' ? XCircle : d.level === 'warning' ? AlertTriangle : InfoIcon;

  return (
    <div className={cn('rounded-lg border overflow-hidden mb-2', levelColor.border, levelColor.bg)}>
      {/* Header row */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-start gap-2.5 px-3 py-2 text-left hover:bg-white/5 transition-colors"
      >
        <Icon className={cn('h-4 w-4 mt-0.5 shrink-0', levelColor.icon)} />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
            <span className={cn('text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded', levelColor.badge)}>
              {d.level}
            </span>
            <span className="text-gray-400 text-[11px] font-mono truncate">
              {d.file}
              <span className="text-gray-600">:{d.line}:{d.col}</span>
            </span>
          </div>
          <p className="text-[12px] text-gray-200 leading-snug font-medium break-words">{d.message}</p>
        </div>
        <span className="text-gray-600 text-[10px] ml-1 mt-1 shrink-0">{expanded ? '▲' : '▼'}</span>
      </button>

      {/* Snippet */}
      {expanded && d.snippet && d.snippet.length > 0 && (
        <div className="border-t border-white/5 bg-black/20">
          <pre className="px-3 py-2 text-[11px] font-mono leading-relaxed overflow-x-auto text-gray-300 whitespace-pre">
            {d.snippet.map((line, idx) => {
              // caret lines (containing only spaces, pipes and ^)
              const isCaretLine = /^\s*\|?\s*\^+\s*$/.test(line);
              const isPipeLine  = /^\s*\|\s*$/.test(line);
              return (
                <span
                  key={idx}
                  className={cn(
                    'block',
                    isCaretLine ? 'text-red-400'   : '',
                    isPipeLine  ? 'text-gray-600'   : '',
                  )}
                >
                  {line}
                </span>
              );
            })}
          </pre>
        </div>
      )}
    </div>
  );
}

function SuccessView({ stdout }: { stdout: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-emerald-400 text-[11px] font-semibold uppercase tracking-widest mb-2">
        <CheckCircle2 className="h-4 w-4" />
        Compiled &amp; ran successfully
      </div>
      {stdout ? (
        <pre className="text-green-300 font-mono text-[12px] leading-relaxed whitespace-pre-wrap bg-emerald-950/20 border border-emerald-800/30 rounded-lg px-3 py-2">
          {stdout}
        </pre>
      ) : (
        <p className="text-gray-500 text-xs italic">Program exited with code 0 (no output)</p>
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

const parseAnsi = (text: string) => {
  const parts = text.split(/\x1b\[([0-9;]*)m/);
  const elements: React.ReactNode[] = [];
  let currentStyle: React.CSSProperties = {};
  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 0) {
      if (parts[i]) elements.push(<span key={i} style={{ ...currentStyle }}>{parts[i]}</span>);
    } else {
      const code = parts[i];
      if (code === '0' || code === '') currentStyle = {};
      else if (code.includes('31')) currentStyle = { color: '#f87171' };
      else if (code.includes('32')) currentStyle = { color: '#4ade80' };
      else if (code.includes('33')) currentStyle = { color: '#facc15' };
      else if (code.includes('36')) currentStyle = { color: '#22d3ee' };
    }
  }
  return elements;
};

export function OutputConsole() {
  const {
    output, setOutput,
    wsOutput, setWsOutput,
    terminalHeight, setTerminalHeight,
    isTerminalMaximized, setTerminalMaximized,
    isRunning,
  } = useEditorStore();

  const [isResizing, setIsResizing] = useState(false);
  const [inputBuffer, setInputBuffer] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const desktopInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [wsOutput, output, inputBuffer]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newHeight = window.innerHeight - e.clientY - 56;
      setTerminalHeight(Math.max(100, Math.min(newHeight, window.innerHeight - 200)));
    };
    const handleMouseUp = () => setIsResizing(false);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const focusInput = () => {
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        desktopInputRef.current?.focus();
      }, 50);
    }
  };

  useEffect(() => {
    if (isRunning) {
      if (terminalHeight < 240) {
        setTerminalHeight(240);
      }
      focusInput();
    } else {
      setInputBuffer('');
    }
  }, [isRunning]);

  // Global keydown handler: auto-focus input when program is running and user starts typing
  useEffect(() => {
    if (!isRunning) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement;
      // Do not redirect focus if user is typing in Monaco editor or another input
      if (active && (active.tagName === 'TEXTAREA' || active.tagName === 'INPUT')) {
        return;
      }
      if (desktopInputRef.current) {
        desktopInputRef.current.focus();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isRunning]);

  const sendEnter = () => {
    if ((window as any).sendCInput) {
      (window as any).sendCInput(inputBuffer + '\n');
      setInputBuffer('');
    }
  };
  const sendCtrlC = () => {
    if ((window as any).sendCInput) {
      (window as any).sendCInput('\x03');
      setInputBuffer('');
    }
  };

  // Parse diagnostics when there is stderr output from a non-running state
  const parsed = output?.stderr ? parseDiagnostics(output.stderr) : null;
  const hasWsOutput = wsOutput.length > 0;
  const hasOutput = !!output;

  // Summary counts
  const errorCount   = parsed?.diagnostics.filter(d => d.level === 'error').length ?? 0;
  const warningCount = parsed?.diagnostics.filter(d => d.level === 'warning').length ?? 0;

  return (
    <div
      className={cn(
        'bg-[#0a0a14] flex flex-col border-t border-dark-700',
        isTerminalMaximized && 'fixed inset-0 z-50 h-screen',
      )}
      style={isTerminalMaximized ? {} : { height: `${terminalHeight}px` }}
    >
      <style jsx global>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .terminal-cursor {
          display: inline-block;
          width: 8px;
          height: 15px;
          background-color: #38bdf8;
          margin-left: 2px;
          vertical-align: middle;
          box-shadow: 0 0 6px rgba(56, 189, 248, 0.8);
          animation: blink 1s step-end infinite;
        }
      `}</style>

      {/* Resize Handle */}
      {!isTerminalMaximized && (
        <div
          onMouseDown={e => { e.preventDefault(); setIsResizing(true); }}
          className="h-1 w-full cursor-ns-resize hover:bg-neb-500 transition-colors absolute top-0 z-10"
        />
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-dark-900 border-b border-dark-700 shrink-0">
        <div className="flex items-center gap-2">
          <Terminal className="h-3.5 w-3.5 text-gray-600" />
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Output</span>
          {isRunning && (
            <span className="flex items-center gap-1.5 text-[10px] text-neb-400 animate-pulse">● Running (Interactive)...</span>
          )}
          {!isRunning && errorCount > 0 && (
            <span className="text-[10px] font-bold text-red-400 bg-red-950/40 px-1.5 py-0.5 rounded border border-red-800/30">
              {errorCount} error{errorCount !== 1 ? 's' : ''}
            </span>
          )}
          {!isRunning && warningCount > 0 && (
            <span className="text-[10px] font-bold text-yellow-400 bg-yellow-950/30 px-1.5 py-0.5 rounded border border-yellow-800/30">
              {warningCount} warning{warningCount !== 1 ? 's' : ''}
            </span>
          )}
          {!isRunning && output?.success && (
            <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> OK
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setTerminalMaximized(!isTerminalMaximized)}
            className="p-1 rounded hover:bg-dark-600 text-gray-500"
          >
            {isTerminalMaximized ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={() => { setWsOutput([]); setOutput(null); }}
            className="p-1 rounded hover:bg-dark-600 text-gray-500"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div
        ref={scrollRef}
        onClick={focusInput}
        className="flex-1 p-3 overflow-auto select-text bg-[#0a0a14] relative cursor-text scroll-smooth"
      >
        {/* Empty state */}
        {!hasOutput && !hasWsOutput && !isRunning && (
          <p className="text-gray-700 italic text-xs">Run your code to see output here…</p>
        )}

        {/* Streaming / interactive output (ws) */}
        {(hasWsOutput || isRunning) && (
          <pre className="font-mono text-[12px] leading-relaxed whitespace-pre-wrap break-all text-gray-300">
            {wsOutput.map((text, i) => <span key={i}>{parseAnsi(text)}</span>)}
            {/* Show the local line buffer inline with blinking cursor */}
            {isRunning && (
              <span className="text-emerald-400 font-semibold font-mono">
                {inputBuffer}
                <span className="terminal-cursor" />
              </span>
            )}
          </pre>
        )}

        {/* Static output after execution finishes */}
        {!hasWsOutput && hasOutput && (
          output!.success
            ? <SuccessView stdout={output!.stdout || ''} />
            : (
              <div className="space-y-1">
                {/* Structured GCC diagnostics */}
                {parsed && parsed.diagnostics.length > 0 && (
                  <div className="space-y-1 mb-2">
                    {parsed.diagnostics.map((d, i) => <DiagnosticCard key={i} d={d} />)}
                  </div>
                )}

                {/* Leftover stderr not captured by parser (e.g. linker errors) */}
                {parsed && parsed.rest && (
                  <pre className="font-mono text-[11px] text-orange-300 whitespace-pre-wrap bg-orange-950/20 border border-orange-800/30 rounded-lg px-3 py-2">
                    {parsed.rest}
                  </pre>
                )}

                {/* Raw stderr fallback if no diagnostics found */}
                {(!parsed || parsed.diagnostics.length === 0) && output!.stderr && (
                  <pre className="font-mono text-[12px] text-red-400 whitespace-pre-wrap leading-relaxed">
                    {output!.stderr}
                  </pre>
                )}

                {/* stdout even on error (e.g. runtime crash after some output) */}
                {output!.stdout && (
                  <pre className="font-mono text-[12px] text-gray-300 whitespace-pre-wrap leading-relaxed mt-2">
                    {output!.stdout}
                  </pre>
                )}

                {output!.timed_out && (
                  <div className="flex items-center gap-2 mt-2 text-yellow-400 text-[11px] font-semibold">
                    <Clock className="h-4 w-4" /> Execution timed out (15 s)
                  </div>
                )}
              </div>
            )
        )}
      </div>

      {/* Interactive Terminal Input Bar */}
      {isRunning && (
        <div className="bg-dark-900 border-t border-neb-500/50 p-2.5 flex items-center gap-2 shrink-0 z-30 shadow-xl">
          <span className="text-neb-400 font-mono text-sm pl-2 font-bold select-none">&gt;</span>
          <input
            ref={desktopInputRef}
            type="text"
            autoFocus
            value={inputBuffer}
            className="flex-1 bg-dark-950 border border-neb-500/50 rounded-lg px-3 py-2 text-white text-xs font-mono outline-none focus:border-neb-400 focus:ring-1 focus:ring-neb-400 placeholder-gray-500 shadow-inner"
            placeholder="Type input here and press Enter (e.g. 42 for scanf)..."
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                sendEnter();
              } else if (e.ctrlKey && e.key.toLowerCase() === 'c') {
                e.preventDefault();
                sendCtrlC();
              }
            }}
            onChange={e => setInputBuffer(e.target.value)}
          />
          <button onClick={sendEnter} className="bg-neb-600 hover:bg-neb-500 text-white px-3.5 py-2 rounded-lg text-xs font-bold shadow-md active:scale-95 transition-all flex items-center gap-1">
            Send ↵
          </button>
          <button onClick={sendCtrlC} className="bg-dark-700 hover:bg-red-900/50 text-gray-300 px-2.5 py-2 rounded-lg text-xs border border-dark-500 active:scale-95 transition-all">
            Ctrl+C
          </button>
        </div>
      )}
    </div>
  );
}
