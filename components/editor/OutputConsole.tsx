'use client';
import { useState, useRef, useEffect } from 'react';
import { Terminal, CheckCircle2, XCircle, Clock, Trash2, Maximize2, Minimize2 } from 'lucide-react';
import { useEditorStore } from '@/store/editor.store';
import { cn } from '@/lib/utils';

export function OutputConsole() {
  const { output, setOutput, wsOutput, setWsOutput, terminalHeight, setTerminalHeight, isTerminalMaximized, setTerminalMaximized, isRunning } = useEditorStore();
  const [isResizing, setIsResizing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [wsOutput, output]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

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

  useEffect(() => {
    if (isRunning && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isRunning]);

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isRunning && (window as any).sendCInput) {
      if (e.key === 'Enter') {
        (window as any).sendCInput('\n');
        if (inputRef.current) inputRef.current.value = '';
      } else if (e.key.length === 1) {
        (window as any).sendCInput(e.key);
      } else if (e.key === 'Backspace') {
        (window as any).sendCInput('\x7f');
      }
    }
  };

  const sendEnter = () => (window as any).sendCInput('\n');
  const sendCtrlC = () => (window as any).sendCInput('\x03');

  return (
    <div className={cn("bg-dark-950 flex flex-col border-t border-dark-700", isTerminalMaximized && "fixed inset-0 z-50 h-screen")} style={isTerminalMaximized ? {} : { height: `${terminalHeight}px` }}>
      <style jsx global>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .terminal-cursor {
          display: inline-block;
          width: 8px;
          height: 15px;
          background-color: #60a5fa;
          margin-left: 2px;
          vertical-align: middle;
          animation: blink 1s step-end infinite;
        }
      `}</style>
      
      {/* Resize Handle */}
      {!isTerminalMaximized && (
        <div 
          onMouseDown={handleMouseDown}
          className="h-1 w-full cursor-ns-resize hover:bg-neb-500 transition-colors absolute top-0 z-10"
        />
      )}
      
      <div className="flex items-center justify-between px-3 py-1.5 bg-dark-900 border-b border-dark-700">
        <div className="flex items-center gap-2">
          <Terminal className="h-3.5 w-3.5 text-gray-600" />
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Output</span>
          {isRunning && <span className="flex items-center gap-1.5 text-[10px] text-neb-400 animate-pulse">● Running...</span>}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setTerminalMaximized(!isTerminalMaximized)} className="p-1 rounded hover:bg-dark-600 text-gray-500">
            {isTerminalMaximized ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
          <button onClick={() => { setWsOutput([]); setOutput(null); }} className="p-1 rounded hover:bg-dark-600 text-gray-500">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div 
        ref={scrollRef}
        onClick={() => inputRef.current?.focus()}
        className="flex-1 p-3 overflow-auto font-mono text-[13px] leading-relaxed select-text bg-[#0d0d16] relative cursor-text scroll-smooth"
      >
        {(!output && wsOutput.length === 0 && !isRunning) ? (
          <p className="text-gray-700 italic text-xs">Run your code to see output here…</p>
        ) : (
          <div className="min-h-full flex flex-col justify-end">
            <pre className="whitespace-pre-wrap break-all pb-24 md:pb-8">
              {wsOutput.map((text, i) => <span key={i} className="text-gray-300">{parseAnsi(text)}</span>)}
              {output?.stdout && <span className="text-gray-300">{output.stdout}</span>}
              {output?.stderr && <span className="text-red-400">{output.stderr}</span>}
              {isRunning && <span className="terminal-cursor" />}
            </pre>
          </div>
        )}
        
        {/* Mobile Input Bar (appears only when running on small screens) */}
        {isRunning && (
          <div className="md:hidden fixed bottom-0 left-0 right-0 bg-dark-900 border-t border-dark-700 p-2 flex items-center gap-2 z-[60]">
            <input 
              ref={inputRef}
              type="text"
              autoFocus
              className="flex-1 bg-dark-950 border border-dark-600 rounded-lg px-3 py-2 text-white text-base outline-none focus:border-neb-500"
              placeholder="Type input..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') { sendEnter(); (e.target as any).value = ''; }
              }}
              onChange={(e) => {
                const val = (e.target as any).value;
                if (val.length > 0) {
                  (window as any).sendCInput(val[val.length - 1]);
                  (e.target as any).value = ''; // Clear immediately after sending char
                }
              }}
            />
            <button onClick={sendEnter} className="bg-neb-700 hover:bg-neb-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg active:scale-95 transition-all">
              ENTER
            </button>
            <button onClick={sendCtrlC} className="bg-dark-700 hover:bg-red-900/50 text-gray-300 px-3 py-2 rounded-lg text-xs border border-dark-500 active:scale-95 transition-all">
              Ctrl+C
            </button>
          </div>
        )}

        {/* Desktop Hidden input */}
        <input 
          ref={inputRef}
          type="text" 
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          className="hidden md:block fixed opacity-0 left-[-9999px] top-0"
          onKeyDown={handleKeyDown}
        />
      </div>
    </div>
  );
}
