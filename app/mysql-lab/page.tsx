'use client';
import { useEffect, useRef, useState } from 'react';
import { Terminal, RefreshCw, Info } from 'lucide-react';
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

  const insertTip = (cmd: string) => {
    setInput(cmd);
    inputRef.current?.focus();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="font-bold text-xl text-white flex items-center gap-2">
            <Terminal className="h-5 w-5 text-neb-400" /> MySQL Lab
          </h1>
          <p className="text-gray-500 text-xs mt-0.5">Live MySQL 8.0 container — your personal database environment</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={connected ? 'success' : 'warning'}>{connected ? '● Connected' : connecting ? '◌ Connecting…' : '○ Disconnected'}</Badge>
          <Button variant="ghost" size="sm" onClick={connected ? disconnect : connect} isLoading={connecting}>
            <RefreshCw className="h-3.5 w-3.5" /> {connected ? 'Reset' : 'Connect'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Terminal */}
        <div className="lg:col-span-3 flex flex-col card overflow-hidden" style={{ minHeight: '520px' }}>
          {/* Terminal output */}
          <div
            ref={termRef}
            className="flex-1 overflow-y-auto p-4 font-mono text-sm leading-relaxed bg-[#0d0d16] select-text"
            style={{ minHeight: '420px', maxHeight: '520px' }}
            onClick={() => inputRef.current?.focus()}
          >
            {lines.length === 0 && !connected && (
              <div className="text-gray-600 italic text-xs">
                {isAuthenticated ? 'Connecting to MySQL…' : 'Please log in to use the MySQL Lab.'}
              </div>
            )}
            {lines.map((line, i) => (
              <div key={i} className={
                line.type === 'input' ? 'text-neb-300' :
                line.type === 'error' ? 'text-red-400' :
                line.type === 'system' ? 'text-yellow-500/70 italic text-xs' :
                'text-green-300'
              }>
                <pre className="whitespace-pre-wrap break-all font-mono text-[13px]">{line.text}</pre>
              </div>
            ))}
          </div>

          {/* Input row */}
          <div className="border-t border-dark-700 flex items-center px-3 py-2 gap-2 bg-[#0d0d16]">
            <span className="text-neb-400 font-mono text-sm shrink-0">mysql&gt;</span>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={connected ? 'Type SQL query and press Enter…' : 'Not connected'}
              disabled={!connected}
              className="flex-1 bg-transparent font-mono text-sm text-white placeholder-gray-700 outline-none caret-neb-400"
              spellCheck={false}
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="off"
            />
            <button
              onClick={() => sendCommand(input)}
              disabled={!connected || !input.trim()}
              className="px-3 py-1 rounded bg-neb-700 hover:bg-neb-600 text-white text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Run ↵
            </button>
          </div>
        </div>

        {/* Tips panel */}
        <div className="flex flex-col gap-3">
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Info className="h-4 w-4 text-neb-400" />
              <h3 className="text-sm font-semibold text-white">Quick Commands</h3>
            </div>
            <p className="text-xs text-gray-500 mb-3">Click any command to paste it into the terminal:</p>
            <div className="flex flex-col gap-1.5">
              {TIPS.map(tip => (
                <button
                  key={tip}
                  onClick={() => insertTip(tip)}
                  className="text-left px-2 py-1.5 rounded-md bg-dark-700 hover:bg-dark-600 text-neb-300 font-mono text-xs transition-colors break-all"
                >
                  {tip}
                </button>
              ))}
            </div>
          </div>
          <div className="card p-4 text-xs text-gray-500 leading-relaxed">
            <p className="font-semibold text-gray-400 mb-2">Tips</p>
            <p>↑ ↓ arrows to navigate history</p>
            <p className="mt-1">Session resets after 15 min of inactivity</p>
            <p className="mt-1">Full MySQL 8.0 support</p>
          </div>
        </div>
      </div>
    </div>
  );
}
