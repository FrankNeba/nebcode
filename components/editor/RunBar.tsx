'use client';
import { Play, Download, RotateCcw, Eye, EyeOff, Save, PanelLeft, PanelLeftClose, Smartphone, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useEditorStore } from '@/store/editor.store';
import { executionService, fileService } from '@/services';
import toast from 'react-hot-toast';

interface Props { showAnswerToggle?: boolean; lessonId?: string; isSidebarOpen?: boolean; onToggleSidebar?: () => void; }

import { useRef } from 'react';

import { getWsUrl } from '@/lib/api';

export function RunBar({ showAnswerToggle, lessonId, isSidebarOpen, onToggleSidebar }: Props) {
  const { activeFile, isRunning, setIsRunning, setWsOutput, appendWsOutput, setOutput, isMobileMode, setMobileMode, toggleAnswer, showAnswer } = useEditorStore();
  const socketRef = useRef<WebSocket | null>(null);

  const handleRun = () => {
    if (!activeFile?.content?.trim()) { toast.error('Write some code first!'); return; }
    if (socketRef.current) socketRef.current.close();

    setIsRunning(true);
    setWsOutput([]);
    setOutput(null);

    const ws = new WebSocket(getWsUrl('/ws/execute/c/'));
    socketRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'run', code: activeFile.content }));
    };

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === 'output') {
        appendWsOutput(msg.data);
      } else if (msg.type === 'status' && msg.data === 'finished') {
        setIsRunning(false);
      }
    };

    ws.onclose = () => setIsRunning(false);
    ws.onerror = () => {
      toast.error('Connection error');
      setIsRunning(false);
    };
  };

  // Add handleInput to send typing to the socket
  (window as any).sendCInput = (data: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'input', data }));
    }
  };

  const handleSave = async () => {
    if (!activeFile) return;
    try {
      await fileService.updateNode(activeFile.id, { content: activeFile.content });
      toast.success('Saved');
    } catch { toast.error('Save failed'); }
  };

  const handleDownload = () => {
    if (!activeFile) return;
    const blob = new Blob([activeFile.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = activeFile.name; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-dark-800 border-b border-dark-700 flex-wrap">
      {onToggleSidebar && (
        <Button onClick={onToggleSidebar} variant="ghost" size="sm" className="px-2">
          {isSidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
        </Button>
      )}
      <Button onClick={handleRun} isLoading={isRunning} size="sm" className="gap-1.5">
        <Play className="h-3.5 w-3.5" /> Run
      </Button>
      <Button onClick={handleSave} variant="secondary" size="sm">
        <Save className="h-3.5 w-3.5" /> Save
      </Button>
      <Button onClick={handleDownload} variant="ghost" size="sm">
        <Download className="h-3.5 w-3.5" />
      </Button>
      <div className="h-4 w-px bg-dark-700 mx-1 hidden md:block" />
      <Button onClick={() => setMobileMode(!isMobileMode)} variant="ghost" size="sm" className="gap-1.5 ml-auto md:ml-0" title={isMobileMode ? 'Switch to Desktop View' : 'Switch to Mobile View'}>
        {isMobileMode ? <Monitor className="h-3.5 w-3.5" /> : <Smartphone className="h-3.5 w-3.5" />}
        <span className="hidden sm:inline">{isMobileMode ? 'Desktop View' : 'Mobile View'}</span>
      </Button>
      {showAnswerToggle && (
        <Button onClick={toggleAnswer} variant={showAnswer ? 'danger' : 'ghost'} size="sm">
          {showAnswer ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          {showAnswer ? 'Hide Answer' : 'Show Answer'}
        </Button>
      )}
    </div>
  );
}
