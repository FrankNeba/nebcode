'use client';
import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
  Globe,
  Play,
  RotateCcw,
  Download,
  Code2,
  Eye,
  Columns,
  Terminal,
  Trash2,
  FileCode,
  Palette,
  Braces,
  Maximize2,
  Minimize2,
  Smartphone,
  Tablet,
  Monitor,
  Copy,
  FolderOpen,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Save,
  Sun,
  Moon,
} from 'lucide-react';
import { FileNode } from '@/types';
import { FileExplorer } from '@/components/editor/FileExplorer';
import { EditorTabs } from '@/components/editor/EditorTabs';
import { useThemeStore } from '@/store/theme.store';
import { cn, copyToClipboard } from '@/lib/utils';
import { Spinner } from '@/components/ui/Spinner';
import toast from 'react-hot-toast';

const CodeEditor = dynamic(
  () => import('@/components/editor/CodeEditor').then((m) => m.CodeEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <Spinner className="h-7 w-7" />
      </div>
    ),
  }
);

interface ConsoleLogItem {
  id: string;
  level: 'log' | 'warn' | 'error' | 'info';
  text: string;
  time: string;
}

const STORAGE_KEY = 'nebcode_web_lab_fs_v2';

const INITIAL_EMPTY_FILES: FileNode[] = [
  {
    id: 'web-html-1',
    name: 'index.html',
    node_type: 'file',
    parent: null,
    content: '',
    language: 'html',
    children: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'web-css-1',
    name: 'style.css',
    node_type: 'file',
    parent: null,
    content: '',
    language: 'css',
    children: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'web-js-1',
    name: 'script.js',
    node_type: 'file',
    parent: null,
    content: '',
    language: 'javascript',
    children: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

function detectLanguage(filename: string): 'html' | 'css' | 'javascript' {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.css')) return 'css';
  if (lower.endsWith('.js')) return 'javascript';
  return 'html';
}

function getFileTypeLabel(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.css')) return 'Cascade Style Sheets (CSS)';
  if (lower.endsWith('.js')) return 'JavaScript File (JS)';
  return 'HyperText Markup Language (HTML)';
}

function flattenFiles(nodes: FileNode[]): FileNode[] {
  const list: FileNode[] = [];
  for (const node of nodes) {
    if (node.node_type === 'file') {
      list.push(node);
    }
    if (node.children && node.children.length > 0) {
      list.push(...flattenFiles(node.children));
    }
  }
  return list;
}

function updateNodeInTree(
  nodes: FileNode[],
  id: string,
  updater: (n: FileNode) => FileNode
): FileNode[] {
  return nodes.map((node) => {
    if (node.id === id) {
      return updater(node);
    }
    if (node.children && node.children.length > 0) {
      return { ...node, children: updateNodeInTree(node.children, id, updater) };
    }
    return node;
  });
}

function deleteNodeFromTree(nodes: FileNode[], id: string): FileNode[] {
  return nodes
    .filter((node) => node.id !== id)
    .map((node) =>
      node.children
        ? { ...node, children: deleteNodeFromTree(node.children, id) }
        : node
    );
}

function insertNodeIntoTree(
  nodes: FileNode[],
  parentId: string | null,
  newNode: FileNode
): FileNode[] {
  if (!parentId) {
    return [...nodes, newNode];
  }
  return nodes.map((node) => {
    if (node.id === parentId && node.node_type === 'folder') {
      return {
        ...node,
        children: [...(node.children || []), newNode],
      };
    }
    if (node.children && node.children.length > 0) {
      return {
        ...node,
        children: insertNodeIntoTree(node.children, parentId, newNode),
      };
    }
    return node;
  });
}

export default function WebLabClient() {
  const { theme, toggleTheme } = useThemeStore();
  const [files, setFiles] = useState<FileNode[]>(INITIAL_EMPTY_FILES);
  const [openFiles, setOpenFiles] = useState<FileNode[]>(INITIAL_EMPTY_FILES);
  const [activeFileId, setActiveFileId] = useState<string>('web-html-1');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  // Default view is 'code' (not split)
  const [viewMode, setViewMode] = useState<'code' | 'split' | 'preview'>('code');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [previewDevice, setPreviewDevice] = useState<'full' | 'mobile' | 'tablet'>('full');
  const [showConsole, setShowConsole] = useState<boolean>(true);
  const [logs, setLogs] = useState<ConsoleLogItem[]>([]);
  const [srcDoc, setSrcDoc] = useState<string>('');
  const [runVersion, setRunVersion] = useState<number>(0);
  const [previewHtmlFileName, setPreviewHtmlFileName] = useState<string>('index.html');

  // Load saved file tree on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.files) && parsed.files.length > 0) {
          setFiles(parsed.files);
          const allFlat = flattenFiles(parsed.files);
          setOpenFiles(allFlat.slice(0, 6));
          if (parsed.activeFileId && allFlat.some((f) => f.id === parsed.activeFileId)) {
            setActiveFileId(parsed.activeFileId);
          } else if (allFlat[0]) {
            setActiveFileId(allFlat[0].id);
          }
        }
      }
    } catch {
      // ignore storage errors
    }
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsSidebarOpen(false);
      setShowConsole(false);
    }
  }, []);

  // Save workspace changes
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ files, activeFileId })
      );
    } catch {
      // ignore storage errors
    }
  }, [files, activeFileId]);

  const allFlatFiles = flattenFiles(files);
  const activeFile =
    allFlatFiles.find((f) => f.id === activeFileId) || allFlatFiles[0] || null;

  // Keep openFiles synchronized with latest content from files tree
  const syncedOpenFiles = openFiles
    .map((of) => allFlatFiles.find((f) => f.id === of.id))
    .filter((f): f is FileNode => Boolean(f));

  // Build combined HTML document resolving <link href="..."> and <script src="..."> tags
  const buildCombinedHtml = useCallback(
    (includeBridge = true, overrideHtmlFile?: string) => {
      const flat = flattenFiles(files);
      const targetHtmlFile =
        (overrideHtmlFile
          ? flat.find((f) => f.name.toLowerCase() === overrideHtmlFile.toLowerCase())
          : null) ||
        (activeFile && activeFile.name.toLowerCase().endsWith('.html') ? activeFile : null) ||
        flat.find((f) => f.name.toLowerCase() === 'index.html') ||
        flat.find((f) => f.name.toLowerCase().endsWith('.html'));

      let doc = targetHtmlFile?.content || '';
      const injectedCssIds = new Set<string>();
      const injectedJsIds = new Set<string>();

      // 1. Resolve <link ... href="style.css" ...> tags in HTML against workspace CSS files
      doc = doc.replace(/<link\b[^>]*href=["']([^"']+)["'][^>]*>/gi, (fullMatch, hrefVal) => {
        const cleanHref = hrefVal.split('?')[0].split('#')[0].replace(/^\.\//, '').trim();
        const baseName = cleanHref.split('/').pop() || cleanHref;
        const matchedCss = flat.find(
          (f) =>
            f.name.toLowerCase().endsWith('.css') &&
            (f.name.toLowerCase() === cleanHref.toLowerCase() ||
              f.name.toLowerCase() === baseName.toLowerCase())
        );
        if (matchedCss) {
          injectedCssIds.add(matchedCss.id);
          return `<style data-linked-from="${matchedCss.name}">\n/* ${matchedCss.name} */\n${matchedCss.content || ''}\n</style>`;
        }
        return fullMatch;
      });

      // 2. Resolve <script ... src="script.js" ...></script> tags in HTML against workspace JS files
      doc = doc.replace(
        /<script\b[^>]*src=["']([^"']+)["'][^>]*>\s*<\/script>/gi,
        (fullMatch, srcVal) => {
          const cleanSrc = srcVal.split('?')[0].split('#')[0].replace(/^\.\//, '').trim();
          const baseName = cleanSrc.split('/').pop() || cleanSrc;
          const matchedJs = flat.find(
            (f) =>
              f.name.toLowerCase().endsWith('.js') &&
              (f.name.toLowerCase() === cleanSrc.toLowerCase() ||
                f.name.toLowerCase() === baseName.toLowerCase())
          );
          if (matchedJs) {
            injectedJsIds.add(matchedJs.id);
            return `<script data-linked-from="${matchedJs.name}">\ntry {\n// ${matchedJs.name}\n${matchedJs.content || ''}\n} catch (err) { console.error(err && err.message ? err.message : err); }\n</script>`;
          }
          return fullMatch;
        }
      );

      // 3. Also collect any remaining CSS/JS files not explicitly linked via <link>/<script>
      const remainingCss = flat
        .filter((f) => f.name.toLowerCase().endsWith('.css') && !injectedCssIds.has(f.id) && (f.content || '').trim().length > 0)
        .map((f) => `/* ${f.name} */\n${f.content || ''}`)
        .join('\n\n');

      const remainingJs = flat
        .filter((f) => f.name.toLowerCase().endsWith('.js') && !injectedJsIds.has(f.id) && (f.content || '').trim().length > 0)
        .map((f) => `// ${f.name}\n${f.content || ''}`)
        .join('\n\n');

      const consoleBridge = includeBridge
        ? `<script>
(function() {
  function send(level, args) {
    try {
      var serialized = Array.prototype.slice.call(args).map(function(a) {
        if (typeof a === 'object' && a !== null) {
          try { return JSON.stringify(a); } catch (e) { return String(a); }
        }
        return String(a);
      });
      window.parent.postMessage({ source: 'nebcode-web-preview', level: level, args: serialized }, '*');
    } catch (e) {}
  }
  var origLog = console.log, origWarn = console.warn, origErr = console.error, origInfo = console.info;
  console.log = function() { send('log', arguments); origLog.apply(console, arguments); };
  console.warn = function() { send('warn', arguments); origWarn.apply(console, arguments); };
  console.error = function() { send('error', arguments); origErr.apply(console, arguments); };
  console.info = function() { send('info', arguments); origInfo.apply(console, arguments); };
  window.addEventListener('error', function(e) {
    send('error', [e.message + (e.lineno ? ' (line ' + e.lineno + ')' : '')]);
  });
  document.addEventListener('click', function(e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (href && !/^(https?:|mailto:|tel:|#)/i.test(href) && href.toLowerCase().endsWith('.html')) {
      e.preventDefault();
      window.parent.postMessage({ source: 'nebcode-web-preview', type: 'navigate', href: href }, '*');
    }
  });
})();
</script>`
        : '';

      const extraStyleTag = remainingCss ? `<style>\n${remainingCss}\n</style>` : '';
      const extraScriptTag = remainingJs
        ? `<script>\ntry {\n${remainingJs}\n} catch (err) { console.error(err && err.message ? err.message : err); }\n</script>`
        : '';

      if (!/<html[\s>]/i.test(doc)) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
${consoleBridge}
${extraStyleTag}
</head>
<body>
${doc}
${extraScriptTag}
</body>
</html>`;
      }

      if (/<\/head>/i.test(doc)) {
        doc = doc.replace(/<\/head>/i, `${consoleBridge}\n${extraStyleTag}\n</head>`);
      } else {
        doc = `${consoleBridge}\n${extraStyleTag}\n` + doc;
      }

      if (/<\/body>/i.test(doc)) {
        doc = doc.replace(/<\/body>/i, `${extraScriptTag}\n</body>`);
      } else {
        doc = doc + `\n${extraScriptTag}`;
      }
      return doc;
    },
    [files, activeFile]
  );

  // Listen for console messages & relative .html page navigation from sandboxed iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data || event.data.source !== 'nebcode-web-preview') return;
      if (event.data.type === 'navigate' && event.data.href) {
        const cleanHref = String(event.data.href).replace(/^\.\//, '').trim();
        setPreviewHtmlFileName(cleanHref);
        setSrcDoc(buildCombinedHtml(true, cleanHref));
        setRunVersion((v) => v + 1);
        return;
      }
      const { level, args } = event.data;
      const now = new Date().toLocaleTimeString([], { hour12: false });
      setLogs((prev) => [
        ...prev.slice(-99),
        {
          id: `${Date.now()}-${Math.random()}`,
          level: level || 'log',
          text: Array.isArray(args) ? args.join(' ') : String(args),
          time: now,
        },
      ]);
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [buildCombinedHtml]);

  const runPreview = useCallback(() => {
    const flat = flattenFiles(files);
    const target =
      (activeFile && activeFile.name.toLowerCase().endsWith('.html') ? activeFile : null) ||
      flat.find((f) => f.name.toLowerCase() === 'index.html') ||
      flat.find((f) => f.name.toLowerCase().endsWith('.html'));
    const targetName = target?.name || 'index.html';
    setPreviewHtmlFileName(targetName);
    setLogs([]);
    setSrcDoc(buildCombinedHtml(true, targetName));
    setRunVersion((v) => v + 1);
  }, [buildCombinedHtml, files, activeFile]);

  // File Explorer handlers
  const handleSelectFile = (node: FileNode) => {
    setActiveFileId(node.id);
    setOpenFiles((prev) => (prev.some((f) => f.id === node.id) ? prev : [...prev, node]));
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const handleCloseTab = (id: string) => {
    setOpenFiles((prev) => {
      const next = prev.filter((f) => f.id !== id);
      if (activeFileId === id) {
        setActiveFileId(next[next.length - 1]?.id || '');
      }
      return next;
    });
  };

  const handleCreateFile = (parentId: string | null, rawName: string) => {
    const name = rawName.includes('.') ? rawName : `${rawName}.html`;
    const newNode: FileNode = {
      id: `web-file-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name,
      node_type: 'file',
      parent: parentId,
      content: '',
      language: detectLanguage(name),
      children: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setFiles((prev) => insertNodeIntoTree(prev, parentId, newNode));
    setOpenFiles((prev) => [...prev, newNode]);
    setActiveFileId(newNode.id);
    toast.success(`Created ${name}`);
  };

  const handleCreateFolder = (parentId: string | null, name: string) => {
    const newFolder: FileNode = {
      id: `web-folder-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name,
      node_type: 'folder',
      parent: parentId,
      content: '',
      language: 'html',
      children: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setFiles((prev) => insertNodeIntoTree(prev, parentId, newFolder));
    toast.success(`Created folder ${name}`);
  };

  const handleDeleteNode = (node: FileNode) => {
    if (!confirm(`Delete "${node.name}"?`)) return;
    setFiles((prev) => deleteNodeFromTree(prev, node.id));
    setOpenFiles((prev) => {
      const next = prev.filter((f) => f.id !== node.id);
      if (activeFileId === node.id) {
        setActiveFileId(next[next.length - 1]?.id || '');
      }
      return next;
    });
    toast.success(`Deleted ${node.name}`);
  };

  const handleRenameNode = (node: FileNode, newName: string) => {
    setFiles((prev) =>
      updateNodeInTree(prev, node.id, (n) => ({
        ...n,
        name: newName,
        language: n.node_type === 'file' ? detectLanguage(newName) : n.language,
        updated_at: new Date().toISOString(),
      }))
    );
    toast.success(`Renamed to ${newName}`);
  };

  const handleCodeChange = (val: string) => {
    if (!activeFile) return;
    setFiles((prev) =>
      updateNodeInTree(prev, activeFile.id, (n) => ({
        ...n,
        content: val,
        updated_at: new Date().toISOString(),
      }))
    );
  };

  const handleDownloadHtml = () => {
    const standalone = buildCombinedHtml(false);
    const blob = new Blob([standalone], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeFile?.name.endsWith('.html')
      ? activeFile.name
      : 'nebcode-web-project.html';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Downloaded HTML file');
  };

  const contentLength = activeFile?.content?.length || 0;
  const lineCount = activeFile?.content ? activeFile.content.split('\n').length : 1;

  return (
    <div
      className={cn(
        'flex flex-col bg-dark-950 overflow-hidden select-none',
        isFullscreen
          ? 'fixed inset-0 z-[200] h-screen w-screen'
          : 'h-[calc(100dvh-116px)] md:h-[calc(100dvh-56px)]'
      )}
    >
      {/* Floating Exit Fullscreen Button (Only visible when Fullscreen View is active) */}
      {isFullscreen && (
        <button
          type="button"
          onClick={() => setIsFullscreen(false)}
          className="fixed top-3 right-3 z-[210] flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-dark-900/90 hover:bg-dark-800 border border-neb-500/60 text-white text-xs font-bold shadow-2xl backdrop-blur-md transition-all"
          title="Exit Fullscreen View"
        >
          <Minimize2 className="h-3.5 w-3.5 text-neb-400" />
          <span>Exit Fullscreen</span>
        </button>
      )}

      {/* ─── TOP ACTION & TOOLBAR (Hidden in Fullscreen View) ─── */}
      {!isFullscreen && (
        <div className="flex items-center justify-between gap-2 px-3 py-2 bg-dark-900 border-b border-dark-700 shrink-0 flex-wrap">
          {/* Left: Sidebar Toggle + Lab Badge + New File + Save */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsSidebarOpen((v) => !v)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 border border-dark-700 text-xs font-semibold text-gray-200 transition"
              title="Toggle File Explorer"
            >
              {isSidebarOpen ? (
                <PanelLeftClose className="h-3.5 w-3.5 text-neb-500" />
              ) : (
                <PanelLeftOpen className="h-3.5 w-3.5 text-neb-500" />
              )}
              <span className="hidden sm:inline">Files</span>
            </button>

            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neb-600/15 border border-neb-600/30 text-neb-500 text-xs font-extrabold">
              <Globe className="h-3.5 w-3.5" />
              <span>Web Lab</span>
            </div>

            <button
              type="button"
              onClick={() => {
                const name = prompt('Enter new file name (e.g. about.html, style.css, script.js):');
                if (name && name.trim()) {
                  handleCreateFile(null, name.trim());
                }
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 border border-dark-700 text-xs font-semibold text-gray-200 transition"
              title="Create New File"
            >
              <Plus className="h-3.5 w-3.5 text-neb-500" />
              <span>New File</span>
            </button>

            <button
              type="button"
              onClick={() => {
                runPreview();
                toast.success(`Saved ${activeFile?.name || 'file'}`);
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 border border-dark-700 text-xs font-semibold text-gray-200 transition"
              title="Save File (Ctrl+S)"
            >
              <Save className="h-3.5 w-3.5 text-neb-500" />
              <span className="hidden md:inline">Save</span>
            </button>
          </div>

          {/* Center: View Switcher (Code / Split / Preview) */}
          <div className="flex items-center bg-dark-950 p-0.5 rounded-xl border border-dark-700">
            <button
              type="button"
              onClick={() => setViewMode('code')}
              className={cn(
                'flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition',
                viewMode === 'code'
                  ? 'bg-neb-600 text-white shadow'
                  : 'text-gray-400 hover:text-white'
              )}
            >
              <Code2 className="h-3.5 w-3.5" />
              <span>Code</span>
            </button>
            <button
              type="button"
              onClick={() => {
                runPreview();
                setViewMode('split');
              }}
              className={cn(
                'hidden md:flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition',
                viewMode === 'split'
                  ? 'bg-neb-600 text-white shadow'
                  : 'text-gray-400 hover:text-white'
              )}
            >
              <Columns className="h-3.5 w-3.5" />
              <span>Split</span>
            </button>
            <button
              type="button"
              onClick={() => {
                runPreview();
                setViewMode('preview');
              }}
              className={cn(
                'flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition',
                viewMode === 'preview'
                  ? 'bg-neb-600 text-white shadow'
                  : 'text-gray-400 hover:text-white'
              )}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Preview</span>
            </button>
          </div>

          {/* Right: Run + Dark/Light Toggle + Fullscreen + Download */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                runPreview();
                if (viewMode === 'code') {
                  setViewMode('preview');
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition active:scale-95 shadow-sm"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Run</span>
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 border border-dark-700 text-gray-200 text-xs font-semibold transition"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <Sun className="h-3.5 w-3.5 text-amber-400" />
              ) : (
                <Moon className="h-3.5 w-3.5 text-neb-500" />
              )}
              <span className="hidden lg:inline">{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsFullscreen(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 border border-dark-700 text-gray-200 text-xs font-semibold transition"
              title="Fullscreen View (See entire code or preview output alone)"
            >
              <Maximize2 className="h-3.5 w-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Fullscreen</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadHtml}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 border border-dark-700 text-gray-200 text-xs font-semibold transition"
              title="Download HTML file"
            >
              <Download className="h-3.5 w-3.5 text-neb-500" />
            </button>
          </div>
        </div>
      )}

      {/* ─── MAIN WORKSPACE AREA ─── */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        {/* File Explorer Sidebar (Hidden in Fullscreen View) */}
        {!isFullscreen && (
          <div
            className={cn(
              'shrink-0 z-20 h-full transition-all',
              isSidebarOpen ? 'block absolute md:static inset-y-0 left-0 shadow-2xl md:shadow-none' : 'hidden'
            )}
          >
            <FileExplorer
              nodes={files}
              activeFileId={activeFile?.id || null}
              onSelectFile={handleSelectFile}
              onCreateFile={handleCreateFile}
              onCreateFolder={handleCreateFolder}
              onDelete={handleDeleteNode}
              onRename={handleRenameNode}
              onClose={() => setIsSidebarOpen(false)}
            />
          </div>
        )}

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0 min-w-0">
          {/* ─── CODE EDITOR PANE ─── */}
          {(viewMode === 'code' || viewMode === 'split') && (
            <div
              className={cn(
                'flex flex-col overflow-hidden min-h-0 border-b md:border-b-0 md:border-r border-dark-700',
                viewMode === 'split' && !isFullscreen ? 'h-1/2 md:h-full md:w-1/2' : 'h-full w-full'
              )}
            >
              {/* Open File Tabs (Hidden in Fullscreen View) */}
              {!isFullscreen && (
                <div className="flex items-center justify-between bg-dark-800 border-b border-dark-700 shrink-0">
                  <div className="flex-1 overflow-x-auto no-scrollbar">
                    <EditorTabs
                      openFiles={syncedOpenFiles}
                      activeFileId={activeFile?.id || null}
                      onSelect={handleSelectFile}
                      onClose={handleCloseTab}
                    />
                  </div>
                  {activeFile && (
                    <span className="text-[10px] font-mono uppercase text-gray-400 px-3 shrink-0 hidden sm:flex items-center gap-1">
                      {activeFile.language === 'html' ? (
                        <>
                          <FileCode className="h-3 w-3 text-orange-500" /> HTML5
                        </>
                      ) : activeFile.language === 'css' ? (
                        <>
                          <Palette className="h-3 w-3 text-blue-500" /> CSS3
                        </>
                      ) : (
                        <>
                          <Braces className="h-3 w-3 text-amber-500" /> JavaScript
                        </>
                      )}
                    </span>
                  )}
                </div>
              )}

              {/* CodeMirror 6 Editor (Respects Dark & Light Mode) */}
              {activeFile ? (
                <div className="flex-1 overflow-hidden min-h-0">
                  <CodeEditor
                    height="100%"
                    language={detectLanguage(activeFile.name)}
                    value={activeFile.content}
                    onChange={handleCodeChange}
                    onSave={runPreview}
                    showQuickBar={!isFullscreen}
                  />
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <FolderOpen className="h-12 w-12 text-dark-500 mb-3" />
                  <p className="text-gray-400 text-sm font-semibold">No file selected</p>
                  <p className="text-gray-500 text-xs mt-1">
                    Select a file from the Explorer or click &ldquo;New File&rdquo; above.
                  </p>
                </div>
              )}

              {/* Bottom Status Bar (Hidden in Fullscreen View) */}
              {!isFullscreen && activeFile && (
                <div className="flex items-center justify-between px-3 py-1 bg-dark-900 border-t border-dark-700 text-[11px] font-mono text-gray-400 shrink-0 overflow-x-auto no-scrollbar gap-4">
                  <span className="truncate">{getFileTypeLabel(activeFile.name)}</span>
                  <div className="flex items-center gap-4 shrink-0 text-[10px]">
                    <span>
                      Length: {contentLength} | Lines: {lineCount}
                    </span>
                    <span className="hidden sm:inline">UTF-8</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── BROWSER PREVIEW + JS CONSOLE PANE ─── */}
          {(viewMode === 'preview' || viewMode === 'split') && (
            <div
              className={cn(
                'flex flex-col overflow-hidden min-h-0 bg-dark-950',
                viewMode === 'split' && !isFullscreen ? 'h-1/2 md:h-full md:w-1/2' : 'h-full w-full'
              )}
            >
              {/* Simulated Browser Address & Controls Bar (Hidden in Fullscreen View) */}
              {!isFullscreen && (
                <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-dark-900 border-b border-dark-700 shrink-0">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => setViewMode('code')}
                      className="px-2.5 py-1 rounded-lg bg-dark-800 hover:bg-dark-700 border border-dark-700 text-xs font-bold text-gray-200 flex items-center gap-1 shrink-0"
                    >
                      <Code2 className="h-3.5 w-3.5 text-neb-500" />
                      <span>Back to Editor</span>
                    </button>
                    <div className="px-2.5 py-1 rounded-md bg-dark-950 border border-dark-700 text-[11px] font-mono text-gray-400 truncate flex-1 max-w-xs">
                      http://localhost/{previewHtmlFileName}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <div className="hidden sm:flex items-center bg-dark-950 rounded-lg p-0.5 border border-dark-700 mr-1">
                      <button
                        type="button"
                        onClick={() => setPreviewDevice('mobile')}
                        className={cn(
                          'p-1 rounded text-xs transition',
                          previewDevice === 'mobile'
                            ? 'bg-neb-600 text-white'
                            : 'text-gray-400 hover:text-white'
                        )}
                        title="Phone Width (375px)"
                      >
                        <Smartphone className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewDevice('tablet')}
                        className={cn(
                          'p-1 rounded text-xs transition',
                          previewDevice === 'tablet'
                            ? 'bg-neb-600 text-white'
                            : 'text-gray-400 hover:text-white'
                        )}
                        title="Tablet Width (768px)"
                      >
                        <Tablet className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewDevice('full')}
                        className={cn(
                          'p-1 rounded text-xs transition',
                          previewDevice === 'full'
                            ? 'bg-neb-600 text-white'
                            : 'text-gray-400 hover:text-white'
                        )}
                        title="Full Width"
                      >
                        <Monitor className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={runPreview}
                      className="p-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 border border-dark-700 text-gray-300 transition"
                      title="Reload Preview"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowConsole(!showConsole)}
                      className={cn(
                        'flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-bold transition',
                        showConsole
                          ? 'bg-neb-600/15 border-neb-600/40 text-neb-400'
                          : 'bg-dark-800 border-dark-700 text-gray-300'
                      )}
                    >
                      <Terminal className="h-3.5 w-3.5" />
                      <span>Console</span>
                      {logs.length > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-neb-600 text-white text-[10px]">
                          {logs.length}
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsFullscreen(true)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-dark-800 hover:bg-dark-700 border border-dark-700 text-gray-200 text-[11px] font-bold transition"
                      title="Fullscreen Preview Output"
                    >
                      <Maximize2 className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="hidden xs:inline">Fullscreen</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Sandboxed Browser Iframe */}
              <div className="flex-1 overflow-auto bg-slate-200 flex justify-center min-h-0">
                <div
                  className={cn(
                    'h-full bg-white transition-all duration-200 shadow-lg',
                    previewDevice === 'mobile' && !isFullscreen
                      ? 'w-[375px] max-w-full border-x border-slate-300'
                      : previewDevice === 'tablet' && !isFullscreen
                      ? 'w-[768px] max-w-full border-x border-slate-300'
                      : 'w-full'
                  )}
                >
                  <iframe
                    key={runVersion}
                    title="Nebcode Web Preview"
                    srcDoc={srcDoc}
                    sandbox="allow-scripts allow-forms allow-modals"
                    className="w-full h-full border-0 bg-white"
                  />
                </div>
              </div>

              {/* Collapsible JavaScript Console (Hidden in Fullscreen View) */}
              {showConsole && !isFullscreen && (
                <div className="h-36 sm:h-44 bg-dark-900 border-t border-dark-700 flex flex-col shrink-0">
                  <div className="flex items-center justify-between px-3 py-1.5 bg-dark-950 border-b border-dark-800">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                      <Terminal className="h-3.5 w-3.5 text-neb-500" />
                      JavaScript Console Output ({logs.length})
                    </span>
                    <div className="flex items-center gap-1.5">
                      {logs.length > 0 && (
                        <button
                          type="button"
                          onClick={async () => {
                            const text = logs
                              .map((l) => `[${l.time}] ${l.level.toUpperCase()}: ${l.text}`)
                              .join('\n');
                            const ok = await copyToClipboard(text);
                            if (ok) toast.success('Console logs copied');
                          }}
                          className="flex items-center gap-1 px-2 py-0.5 rounded bg-dark-800 hover:bg-dark-700 text-[10px] font-semibold text-gray-300 border border-dark-700"
                        >
                          <Copy className="h-3 w-3" /> Copy
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setLogs([])}
                        className="flex items-center gap-1 px-2 py-0.5 rounded bg-dark-800 hover:bg-dark-700 text-[10px] font-semibold text-gray-400 hover:text-white border border-dark-700"
                      >
                        <Trash2 className="h-3 w-3" /> Clear
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-2.5 font-mono text-xs space-y-1 select-text">
                    {logs.length === 0 ? (
                      <p className="text-gray-500 text-[11px] italic">
                        No console output yet. Use console.log() in your .js file to inspect values here.
                      </p>
                    ) : (
                      logs.map((item) => (
                        <div
                          key={item.id}
                          className={cn(
                            'px-2 py-1 rounded border text-[11px] flex items-start gap-2 break-all',
                            item.level === 'error'
                              ? 'bg-red-500/10 border-red-500/30 text-red-400'
                              : item.level === 'warn'
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                              : 'bg-dark-800/60 border-dark-700 text-emerald-400'
                          )}
                        >
                          <span className="text-[10px] text-gray-500 shrink-0">{item.time}</span>
                          <span className="flex-1 whitespace-pre-wrap">{item.text}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
