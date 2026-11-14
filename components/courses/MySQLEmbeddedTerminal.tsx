'use client';
import { useEffect, useRef, useState } from 'react';
import { Terminal, RefreshCw, X, Play, Copy, Check, ClipboardPaste } from 'lucide-react';
import { cn, copyToClipboard } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { useMySQLLabStore } from '@/store/mysql-lab.store';
import { Badge } from '@/components/ui/Badge';
import toast from 'react-hot-toast';

interface MySQLEmbeddedTerminalProps {
  onClose?: () => void;
  title?: string;
}

export function MySQLEmbeddedTerminal({ onClose, title = 'MySQL Lab Session' }: MySQLEmbeddedTerminalProps) {
  const { isAuthenticated } = useAuthStore();
  const termRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const {
    connected,
    connecting,
    lines,
    input,
    setInput,
    connect,
    disconnect,
    sendCommand,
    handleArrowUp,
    handleArrowDown,
  } = useMySQLLabStore();

  useEffect(() => {
    if (isAuthenticated) {
      connect();
    }
  }, [isAuthenticated, connect]);

  useEffect(() => {
    if (termRef.current) {
      termRef.current.scrollTop = termRef.current.scrollHeight;
    }
  }, [lines]);

  const onExecute = () => {
    if (input.trim()) {
      sendCommand(input);
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
      }
    }
  };

  const handleCopy = async (text: string, id: string) => {
    const clean = text.replace(/^mysql>\s*/i, '').trim();
    const ok = await copyToClipboard(clean);
    if (ok) {
      setCopiedId(id);
      toast.success('Command copied!');
      setTimeout(() => setCopiedId(prev => (prev === id ? null : prev)), 2000);
    } else {
      toast.error('Failed to copy');
    }
  };

  const handlePaste = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setInput((input ? input + ' ' : '') + text);
          inputRef.current?.focus();
          toast.success('Pasted!');
          return;
        }
      }
    } catch {
      // fallback
    }
    toast('Long-press inside the input box to paste');
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-full bg-[#06060c] border border-dark-800 rounded-xl overflow-hidden shadow-2xl animate-in slide-in-from-right-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-dark-900 border-b border-dark-800">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-neb-400" />
          <span className="text-xs font-bold text-white truncate">{title}</span>
          <Badge variant={connected ? 'success' : 'warning'} className="text-[9px] px-1.5 py-0">
            {connected ? 'connected' : 'connecting'}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={connected ? disconnect : connect}
            disabled={connecting}
            className="p-1 text-gray-500 hover:text-white rounded transition"
            title="Reset Terminal Connection"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", connecting && "animate-spin")} />
          </button>
          {onClose && (
            <button type="button" onClick={onClose} className="p-1 text-gray-500 hover:text-white rounded transition">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Terminal Output */}
      <div
        ref={termRef}
        className="flex-1 overflow-y-auto p-3 font-mono text-[11px] md:text-xs leading-normal select-text space-y-1.5"
      >
        {lines.length === 0 && !connected && (
          <div className="text-gray-600 italic text-[10px]">
            {isAuthenticated ? 'Connecting database sandbox container...' : 'Sign in to use the MySQL terminal.'}
          </div>
        )}
        {lines.map((line, i) => {
          const lineId = `emb-line-${i}`;
          const isInput = line.type === 'input';
          return (
            <div
              key={i}
              className={cn(
                "mb-0.5 flex items-start justify-between gap-2 rounded px-2 py-1",
                isInput ? 'bg-emerald-950/20 border border-emerald-900/30 text-green-400 font-semibold' :
                  line.type === 'error' ? 'text-red-400 font-medium' :
                    line.type === 'system' ? 'text-yellow-500/80 italic text-[10px]' :
                      'text-green-300'
              )}
            >
              <pre className="whitespace-pre-wrap break-all font-mono leading-normal select-text flex-1">
                {isInput
                  ? (line.text.startsWith('mysql>') ? line.text : `mysql> ${line.text}`)
                  : line.text.replace(/\x1b\[[0-9;]*m/g, '').replace(/^\s*->\s*/gm, '')}
              </pre>
              {(isInput || line.type === 'output') && (
                <button
                  type="button"
                  onClick={() => handleCopy(line.text, lineId)}
                  className="p-1 rounded bg-dark-800 hover:bg-dark-700 text-gray-300 border border-dark-700 shrink-0 active:scale-95"
                  title="Copy command"
                >
                  {copiedId === lineId ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3 text-neb-400" />}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Input Form */}
      <div className="border-t border-dark-800 bg-[#090910] p-2">
        <div className="flex items-start gap-1.5 bg-dark-950/80 border border-dark-850 rounded-lg px-2.5 py-1.5">
          <span className="text-neb-400 font-mono text-[11px] mt-0.5 select-none">mysql&gt;</span>
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
              else if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onExecute();
              }
            }}
            placeholder={connected ? "Type or paste SQL statement..." : "Connecting..."}
            disabled={!connected}
            className="flex-1 bg-transparent font-mono text-[11px] md:text-xs text-white placeholder-gray-700 outline-none caret-neb-400 resize-none min-h-[20px] max-h-[80px] select-text"
            spellCheck={false}
            rows={1}
          />
          {input.trim() && (
            <button
              type="button"
              onClick={() => handleCopy(input, 'emb-input')}
              className="p-1 text-gray-400 hover:text-white transition"
              title="Copy current command"
            >
              {copiedId === 'emb-input' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          )}
          <button
            type="button"
            onClick={handlePaste}
            disabled={!connected}
            className="p-1 text-gray-400 hover:text-white disabled:opacity-25 transition"
            title="Paste command"
          >
            <ClipboardPaste className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onExecute}
            disabled={!connected || !input.trim()}
            className="p-1 text-neb-500 hover:text-neb-400 disabled:opacity-25 transition"
            title="Run SQL"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
          </button>
        </div>
      </div>
    </div>
  );
}
