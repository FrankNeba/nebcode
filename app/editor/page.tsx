'use client';
import { useEffect, useState, useCallback, Suspense } from 'react';
import nextDynamic from 'next/dynamic';
import { useSearchParams, useRouter } from 'next/navigation';
import { Code2, ArrowLeft } from 'lucide-react';
import { FileNode } from '@/types';
import { fileService, executionService } from '@/services';
import { useEditorStore } from '@/store/editor.store';
import { FileExplorer } from '@/components/editor/FileExplorer';
import { EditorTabs } from '@/components/editor/EditorTabs';
import { RunBar } from '@/components/editor/RunBar';
import { OutputConsole } from '@/components/editor/OutputConsole';
import { Spinner } from '@/components/ui/Spinner';
import toast from 'react-hot-toast';

const MonacoEditor = nextDynamic(() => import('@monaco-editor/react'), { ssr: false });

const DEFAULT_C = `#include <stdio.h>

int main() {
    printf("Hello from Nebcode!\\n");
    return 0;
}
`;

export const dynamic = 'force-dynamic';

function EditorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const courseId = searchParams.get('courseId');
  const lessonId = searchParams.get('lessonId');

  const { files, activeFile, openFiles: _openFiles, setFiles, setActiveFile, updateFileContent, isMobileMode } = useEditorStore() as any;
  const [openFiles, setOpenFiles] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const codeParam = searchParams.get('code');
    fileService.listFiles().then(async ({ data }) => {
      let filesData = data;
      // If no files found, request backend to initialize default C session (this creates main.c)
      if (!filesData || filesData.length === 0) {
        try {
          await executionService.getCode({ session_type: 'c' });
          const refreshed = await fileService.listFiles();
          filesData = refreshed.data;
        } catch (e) {
          // fallback
        }
      }
      setFiles(filesData);
      // Auto-open first file
      const firstFile = findFirstFile(filesData);
      if (firstFile) {
        if (codeParam) {
          firstFile.content = codeParam;
          await fileService.updateNode(firstFile.id, { content: codeParam }).catch(() => { });
        }
        openFile(firstFile);
      }
    }).finally(() => setLoading(false));

    // Auto-hide sidebar on mobile
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, [searchParams]);

  function findFirstFile(nodes: FileNode[]): FileNode | null {
    for (const n of nodes) {
      if (n.node_type === 'file') return n;
      const found = findFirstFile(n.children || []);
      if (found) return found;
    }
    return null;
  }

  const openFile = (node: FileNode) => {
    setActiveFile(node);
    setOpenFiles(prev => prev.find(f => f.id === node.id) ? prev : [...prev, node]);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const closeFile = (id: string) => {
    setOpenFiles(prev => {
      const next = prev.filter(f => f.id !== id);
      if (activeFile?.id === id) setActiveFile(next[next.length - 1] || null);
      return next;
    });
  };

  const handleCreateFile = async (parentId: string | null, name: string) => {
    try {
      const payload: any = { name, node_type: 'file', language: 'c' };
      if (name.endsWith('.c')) payload.content = DEFAULT_C;
      if (parentId) payload.parent = parentId;
      const { data } = await fileService.createNode(payload);
      const { data: refreshed } = await fileService.listFiles();
      setFiles(refreshed);
      openFile(data);
    } catch { toast.error('Failed to create file'); }
  };

  const handleCreateFolder = async (parentId: string | null, name: string) => {
    try {
      const payload: any = { name, node_type: 'folder', language: 'c' };
      if (parentId) payload.parent = parentId;
      await fileService.createNode(payload);
      const { data } = await fileService.listFiles();
      setFiles(data);
    } catch { toast.error('Failed to create folder'); }
  };

  const handleDelete = async (node: FileNode) => {
    if (!confirm(`Delete "${node.name}"?`)) return;
    try {
      await fileService.deleteNode(node.id);
      const { data } = await fileService.listFiles();
      setFiles(data);
      if (activeFile?.id === node.id) setActiveFile(null);
      setOpenFiles(prev => prev.filter(f => f.id !== node.id));
    } catch { toast.error('Failed to delete'); }
  };

  const handleRename = async (node: FileNode, name: string) => {
    try {
      await fileService.updateNode(node.id, { name });
      const { data } = await fileService.listFiles();
      setFiles(data);
    } catch { toast.error('Failed to rename'); }
  };

  const handleEditorChange = useCallback(async (value: string | undefined) => {
    if (!activeFile || value === undefined) return;
    updateFileContent(activeFile.id, value);
  }, [activeFile]);

  const handleSave = async () => {
    if (!activeFile) return;
    try {
      await fileService.updateNode(activeFile.id, { content: activeFile.content });
    } catch { }
  };

  if (loading) return <div className="flex items-center justify-center h-[calc(100vh-56px)]"><Spinner className="h-8 w-8" /></div>;

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] overflow-hidden relative">
      {courseId && lessonId && (
        <div className="px-3 py-2 bg-dark-900 border-b border-dark-800 shrink-0">
          <button
            onClick={() => router.push(`/courses/${courseId}/lesson/${lessonId}`)}
            className="text-gray-400 hover:text-white flex items-center gap-2 text-sm font-semibold transition"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Lesson
          </button>
        </div>
      )}
      <div className="flex flex-1 overflow-hidden relative">
        <div className={`${isSidebarOpen ? 'block' : 'hidden'} md:block shrink-0 z-20 h-full transition-all`}>
          <FileExplorer
            nodes={files}
            activeFileId={activeFile?.id || null}
            onSelectFile={openFile}
            onCreateFile={handleCreateFile}
            onCreateFolder={handleCreateFolder}
            onDelete={handleDelete}
            onRename={handleRename}
            onClose={() => setIsSidebarOpen(false)}
          />
        </div>

        <div className={`flex-1 flex flex-col overflow-hidden min-w-0 transition-all duration-300 ${isMobileMode ? 'max-w-md mx-auto border-x border-dark-700 shadow-2xl bg-dark-900' : ''}`}>
          <RunBar isSidebarOpen={isSidebarOpen} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
          <EditorTabs openFiles={openFiles} activeFileId={activeFile?.id || null} onSelect={openFile} onClose={closeFile} />

          <div className="flex-1 flex flex-col overflow-hidden">
            {activeFile ? (
              <div className="flex-1 overflow-hidden">
                <MonacoEditor
                  height="100%"
                  language="c"
                  value={activeFile.content}
                  onChange={handleEditorChange}
                  theme="vs-dark"
                  options={{
                    fontSize: 14,
                    fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                    fontLigatures: false,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    lineNumbers: 'on',
                    padding: { top: 12, bottom: 12 },
                    tabSize: 4,
                    wordWrap: isMobileMode ? 'on' : 'off',
                    automaticLayout: true,
                  }}
                  onMount={() => {
                    // Ctrl/Cmd+S to save
                    document.addEventListener('keydown', (e) => {
                      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                        e.preventDefault();
                        handleSave();
                      }
                    });
                  }}
                />
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <Code2 className="h-12 w-12 text-dark-500 mb-4" />
                <p className="text-gray-600 text-sm">No file open</p>
                <p className="text-gray-700 text-xs mt-1">Create or select a file from the explorer</p>
              </div>
            )}
          </div>

          <div className="h-48 border-t border-dark-700">
            <OutputConsole />
          </div>
        </div>
      </div>
    </div>
  );
}


export default function EditorPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-[calc(100vh-56px)]"><Spinner className="h-8 w-8" /></div>}>
      <EditorContent />
    </Suspense>
  );
}