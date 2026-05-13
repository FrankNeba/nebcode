'use client';
import { useEffect, useRef, useState } from 'react';
import { Terminal, RefreshCw, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getWsUrl } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { mysqlLabService } from '@/services';
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

export default function MySQLLabPage() {
  const { isAuthenticated } = useAuthStore();
  const termRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [lines, setLines] = useState<{ text: string; type: 'output' | 'input' | 'error' | 'system' }[]>([]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);

  const addLine = (text: string, type: 'output' | 'input' | 'error' | 'system' = 'output') => {
    setLines(prev => [...prev, { text, type }]);
  };

  const connect = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    setConnecting(true);
    const ws = new WebSocket(getWsUrl('/ws/mysql-lab/'));
    wsRef.current = ws;

    ws.onopen = () => { setConnected(true); setConnecting(false); };
    ws.onclose = () => { setConnected(false); setConnecting(false); addLine('Connection closed.', 'system'); };
    ws.onerror = () => { setConnected(false); setConnecting(false); addLine('Connection error.', 'error'); };
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'output' || msg.type === 'error') {
          // Split by newlines to preserve formatting
          const text = msg.data.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
          addLine(text, msg.type === 'error' ? 'error' : 'output');
        }
      } catch {
        addLine(e.data, 'output');
      }
    };
  };

  const disconnect = () => {
    wsRef.current?.close();
    wsRef.current = null;
    setConnected(false);
    setLines([]);
  };

  useEffect(() => {
    let mounted = true;
    const startAndConnect = async () => {
      if (!isAuthenticated) return;
      try {
        await mysqlLabService.startSession();
      } catch (e) {
        toast.error('Failed to start MySQL session');
        return;
      }
      if (mounted) connect();
    };
    startAndConnect();
    return () => { mounted = false; wsRef.current?.close(); };
  }, [isAuthenticated]);

  useEffect(() => {
    // Auto-scroll terminal
    if (termRef.current) termRef.current.scrollTop = termRef.current.scrollHeight;
  }, [lines]);

  const sendCommand = (cmd: string) => {
    if (!cmd.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    addLine(`mysql> ${cmd}`, 'input');
    wsRef.current.send(JSON.stringify({ input: cmd }));
    setHistory(prev => [cmd, ...prev.slice(0, 49)]);
    setHistIdx(-1);
    setInput('');
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { sendCommand(input); return; }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const idx = Math.min(histIdx + 1, history.length - 1);
      setHistIdx(idx); setInput(history[idx] || '');
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const idx = Math.max(histIdx - 1, -1);
      setHistIdx(idx); setInput(idx === -1 ? '' : history[idx] || '');
    }
  };

  const handleArrowUp = () => {
    const nextIdx = Math.min(histIdx + 1, history.length - 1);
    if (nextIdx >= 0 && nextIdx < history.length) {
      setHistIdx(nextIdx);
      setInput(history[nextIdx]);
    }
  };

  const handleArrowDown = () => {
    const nextIdx = Math.max(histIdx - 1, -1);
    setHistIdx(nextIdx);
    setInput(nextIdx === -1 ? '' : history[nextIdx]);
  };

  const insertTip = (cmd: string) => {
    setInput(cmd);
    inputRef.current?.focus();
    // Scroll to input
    inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 md:py-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="font-bold text-xl text-white flex items-center gap-2">
            <Terminal className="h-5 w-5 text-neb-400" /> MySQL Lab
          </h1>
          <p className="text-gray-500 text-[10px] md:text-xs mt-0.5">Live MySQL 8.0 container — your personal database environment</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={connected ? 'success' : 'warning'} className="text-[10px] md:text-xs">
            {connected ? '● Connected' : connecting ? '◌ Connecting…' : '○ Disconnected'}
          </Badge>
          <Button variant="ghost" size="xs" onClick={connected ? disconnect : connect} isLoading={connecting} className="h-8 text-xs">
            <RefreshCw className="h-3 w-3" /> {connected ? 'Reset' : 'Connect'}
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-4 gap-4">
        {/* Terminal Container */}
        <div className="lg:col-span-3 flex flex-col card overflow-hidden border-neb-900/30">
          {/* Terminal output */}
          <div
            ref={termRef}
            className="overflow-y-auto p-3 md:p-4 font-mono text-xs md:text-sm leading-relaxed bg-[#0d0d16] select-text h-[280px] md:h-[450px]"
            onClick={() => inputRef.current?.focus()}
          >
            {lines.length === 0 && !connected && (
              <div className="text-gray-600 italic text-[10px]">
                {isAuthenticated ? 'Connecting to MySQL…' : 'Please log in to use the MySQL Lab.'}
              </div>
            )}
            {lines.map((line, i) => (
              <div key={i} className={cn(
                "mb-0.5",
                line.type === 'input' ? 'text-neb-300' :
                  line.type === 'error' ? 'text-red-400' :
                    line.type === 'system' ? 'text-yellow-500/70 italic text-[10px]' :
                      'text-green-300'
              )}>
                <pre className="whitespace-pre-wrap break-all font-mono text-[11px] md:text-[13px] leading-normal opacity-90">
                  {line.text.replace(/\x1b\[[0-9;]*m/g, '')}
                </pre>
              </div>
            ))}
          </div>

          {/* Input Area */}
          <div className="border-t border-dark-700 bg-dark-900/50 backdrop-blur-md">
            <div className="flex items-start px-3 py-3 gap-2">
              <span className="text-neb-400 font-mono text-xs md:text-sm shrink-0 mt-1.5 md:mt-1">mysql&gt;</span>
              <textarea
                ref={inputRef as any}
                value={input}
                onChange={e => {
                  setInput(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowUp') { e.preventDefault(); handleArrowUp(); }
                  else if (e.key === 'ArrowDown') { e.preventDefault(); handleArrowDown(); }
                  else if (e.key === 'Enter' && !e.shiftKey) {
                    const trimmed = input.trim();
                    const isSystemCommand = trimmed.toLowerCase() === 'exit' || trimmed.toLowerCase() === 'quit';
                    if (trimmed.endsWith(';') || isSystemCommand) {
                      e.preventDefault();
                      sendCommand(input);
                    }
                  }
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
            <div className="flex items-center justify-between px-3 pb-3">
              {/* Mobile History Nav */}
              <div className="flex items-center gap-1">
                <button
                  onClick={handleArrowUp}
                  disabled={!connected || history.length === 0}
                  className="p-2 rounded bg-dark-700 hover:bg-dark-600 text-gray-400 disabled:opacity-20 active:scale-95 transition-all"
                  title="Previous Command"
                >
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24"><path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/></svg>
                </button>
                <button
                  onClick={handleArrowDown}
                  disabled={!connected || histIdx === -1}
                  className="p-2 rounded bg-dark-700 hover:bg-dark-600 text-gray-400 disabled:opacity-20 active:scale-95 transition-all"
                  title="Next Command"
                >
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"/></svg>
                </button>
                <span className="text-[10px] text-gray-600 font-mono ml-1 hidden sm:inline">
                  {histIdx === -1 ? '' : `${histIdx + 1}/${history.length}`}
                </span>
              </div>

              <button
                onClick={() => sendCommand(input)}
                disabled={!connected || !input.trim()}
                className="px-5 py-2 rounded-lg bg-neb-600 hover:bg-neb-500 text-white text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shadow-lg shadow-neb-950/20 flex items-center gap-2"
              >
                Execute <span className="opacity-40 font-normal hidden sm:inline">↵</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Commands - Moved to top on mobile or kept in sidebar */}
        <div className="flex flex-col gap-3 order-first lg:order-last">
          <div className="card p-4 bg-dark-900/40 border-neb-900/20">
            <div className="flex items-center gap-2 mb-3">
              <Info className="h-4 w-4 text-neb-400" />
              <h3 className="text-sm font-semibold text-white">Quick Commands</h3>
            </div>
            <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
              {TIPS.map(tip => (
                <button
                  key={tip}
                  onClick={() => insertTip(tip)}
                  className="whitespace-nowrap text-left px-3 py-2 rounded-md bg-dark-800/80 hover:bg-dark-700 text-neb-300 font-mono text-[10px] md:text-xs transition-colors border border-dark-700/50"
                >
                  {tip}
                </button>
              ))}
            </div>
          </div>
          <div className="card p-4 text-[10px] md:text-xs text-gray-500 leading-relaxed hidden md:block">
            <p className="font-semibold text-gray-400 mb-2">Tips</p>
            <p>↑ ↓ arrows to navigate history</p>
            <p className="mt-1">Session resets after 15 min of inactivity</p>
            <p className="mt-1 text-neb-500/70 font-medium">Safe Sandbox Environment</p>
          </div>
        </div>
      </div>
      {/* Spacer for mobile nav */}
      <div className="h-20 md:hidden"></div>
    </div>
  );
}
