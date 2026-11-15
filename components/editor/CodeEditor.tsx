'use client';
import { useRef, useState, useMemo, useCallback } from 'react';
import CodeMirror, { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { cpp } from '@codemirror/lang-cpp';
import { sql } from '@codemirror/lang-sql';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView, keymap } from '@codemirror/view';
import { undo, redo } from '@codemirror/commands';
import {
  Copy,
  ClipboardPaste,
  Check,
  RotateCcw,
  RotateCw,
  CheckSquare,
  X,
  Monitor,
  Smartphone,
} from 'lucide-react';
import { copyToClipboard, cn } from '@/lib/utils';
import { useEditorStore } from '@/store/editor.store';
import { useThemeStore } from '@/store/theme.store';
import toast from 'react-hot-toast';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: 'c' | 'cpp' | 'python' | 'sql' | 'html' | 'css' | 'javascript' | 'js' | string;
  height?: string;
  wordWrap?: boolean;
  onSave?: () => void;
  className?: string;
  showQuickBar?: boolean;
  notepadPlusPlus?: boolean;
}

const MOBILE_SYMBOLS_C = ['Tab', '{', '}', '(', ')', '[', ']', ';', '"', "'", '#', '<', '>', '=', '&', '|', '!', '+', '-', '*', '/', '%', '\\n'];
const MOBILE_SYMBOLS_PYTHON = ['Tab', ':', '(', ')', '[', ']', '{', '}', '=', '==', '!=', '"', "'", '#', 'def ', 'for ', 'in ', 'range()', 'if ', 'else:', 'print()', 'input()', 'return '];
const MOBILE_SYMBOLS_SQL = ['SELECT ', 'FROM ', 'WHERE ', '*', ';', "'", '"', '(', ')', '=', '<', '>', 'JOIN ', 'GROUP BY ', 'ORDER BY '];
const MOBILE_SYMBOLS_HTML = ['Tab', '<', '>', '/', '=', '"', "'", '<div>', '</div>', '<p>', '<h1>', '<link rel="stylesheet" href="style.css">', '<script src="script.js"></script>', '<a>', '<table>', '<tr>', '<td>', 'class=""', 'id=""'];
const MOBILE_SYMBOLS_CSS = ['Tab', '{', '}', ':', ';', '#', '.', 'px', '%', 'rem', 'color: ', 'background: ', 'display: flex;', 'margin: ', 'padding: ', 'border: '];
const MOBILE_SYMBOLS_JS = ['Tab', '{', '}', '(', ')', '[', ']', ';', '=', '=>', '"', "'", 'const ', 'let ', 'function ', 'console.log()', 'document.getElementById("")', 'addEventListener()'];

export function CodeEditor({
  value,
  onChange,
  language = 'c',
  height = '100%',
  wordWrap,
  onSave,
  className,
  showQuickBar = true,
  notepadPlusPlus = false,
}: CodeEditorProps) {
  const editorRef = useRef<ReactCodeMirrorRef>(null);
  const { isMobileMode, setMobileMode } = useEditorStore();
  const { theme } = useThemeStore();
  const [copied, setCopied] = useState(false);
  const [pasteModalOpen, setPasteModalOpen] = useState(false);
  const [pasteBuffer, setPasteBuffer] = useState('');

  // In Desktop Mode (isMobileMode === false), lines do NOT wrap so users swipe left/right like VS Code.
  // In Mobile Mode (isMobileMode === true), lines wrap to fit narrow viewports.
  const effectiveWordWrap = wordWrap !== undefined ? wordWrap : isMobileMode;

  const insertTextAtCursor = useCallback((textToInsert: string) => {
    const view = editorRef.current?.view;
    if (view) {
      const { state } = view;
      const range = state.selection.main;
      view.dispatch({
        changes: { from: range.from, to: range.to, insert: textToInsert },
        selection: { anchor: range.from + textToInsert.length },
      });
      view.focus();
    } else {
      onChange((value || '') + textToInsert);
    }
  }, [onChange, value]);

  const handleCopy = async () => {
    const view = editorRef.current?.view;
    let textToCopy = value || '';
    let isSelection = false;

    if (view) {
      const { from, to } = view.state.selection.main;
      if (to > from) {
        textToCopy = view.state.sliceDoc(from, to);
        isSelection = true;
      }
    }

    if (!textToCopy) {
      toast.error('Nothing to copy');
      return;
    }

    const ok = await copyToClipboard(textToCopy);
    if (ok) {
      setCopied(true);
      toast.success(isSelection ? 'Selected code copied' : 'All code copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error('Failed to copy code');
    }
  };

  const handlePaste = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.readText) {
        const clipText = await navigator.clipboard.readText();
        if (clipText) {
          insertTextAtCursor(clipText);
          toast.success('Pasted from clipboard');
          return;
        }
      }
    } catch {
      // Browser requires manual paste gesture on mobile — open quick paste box
    }
    setPasteBuffer('');
    setPasteModalOpen(true);
  };

  const handleSelectAll = () => {
    const view = editorRef.current?.view;
    if (view) {
      view.dispatch({
        selection: { anchor: 0, head: view.state.doc.length },
      });
      view.focus();
      toast.success('All code selected');
    }
  };

  const handleUndo = () => {
    const view = editorRef.current?.view;
    if (view) {
      undo(view);
      view.focus();
    }
  };

  const handleRedo = () => {
    const view = editorRef.current?.view;
    if (view) {
      redo(view);
      view.focus();
    }
  };

  const handleSymbolTap = (sym: string) => {
    if (sym === 'Tab') {
      insertTextAtCursor('    ');
    } else {
      insertTextAtCursor(sym);
    }
  };

  const isLight = theme === 'light';

  const langExtension = useMemo(() => {
    const norm = (language || 'c').toLowerCase();
    if (norm === 'sql') return sql();
    if (norm === 'html') return html({ autoCloseTags: true, matchClosingTags: true });
    if (norm === 'css') return css();
    if (norm === 'javascript' || norm === 'js') return javascript();
    return cpp();
  }, [language]);

  const extensions = useMemo(() => {
    const exts: any[] = [
      langExtension,
      EditorView.contentAttributes.of({
        autocorrect: 'off',
        autocapitalize: 'off',
        spellcheck: 'false',
        style: 'user-select: text; -webkit-user-select: text;',
      }),
      EditorView.theme({
        '&': {
          height: '100%',
          fontSize: '13.5px',
          backgroundColor: isLight ? '#ffffff' : '#090912',
          color: isLight ? '#0f172a' : '#e8e8f0',
        },
        '.cm-scroller': {
          fontFamily: 'var(--font-jetbrains-mono), "JetBrains Mono", "Fira Code", monospace',
          lineHeight: '1.65',
          overflowX: effectiveWordWrap ? 'hidden' : 'auto',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
        },
        '.cm-content': {
          padding: '12px 0',
          caretColor: '#e11d48',
          whiteSpace: effectiveWordWrap ? 'pre-wrap' : 'pre',
        },
        '.cm-line': {
          padding: '0 16px 0 8px',
        },
        '.cm-gutters': {
          backgroundColor: isLight ? '#f1f5f9' : '#07070e',
          color: isLight ? '#64748b' : '#4b5563',
          borderRight: isLight ? '1px solid #cbd5e1' : '1px solid #1a1a2e',
        },
        '.cm-activeLine': {
          backgroundColor: isLight ? 'rgba(225, 29, 72, 0.05)' : 'rgba(225, 29, 72, 0.06)',
        },
        '.cm-activeLineGutter': {
          backgroundColor: isLight ? 'rgba(225, 29, 72, 0.1)' : 'rgba(225, 29, 72, 0.12)',
          color: '#e11d48',
        },
        '.cm-selectionBackground, ::selection': {
          backgroundColor: isLight ? 'rgba(225, 29, 72, 0.2) !important' : 'rgba(225, 29, 72, 0.3) !important',
        },
      }),
    ];

    if (effectiveWordWrap) {
      exts.push(EditorView.lineWrapping);
    }

    if (onSave) {
      exts.push(
        keymap.of([
          {
            key: 'Mod-s',
            run: () => {
              onSave();
              return true;
            },
          },
        ])
      );
    }

    return exts;
  }, [langExtension, effectiveWordWrap, onSave, isLight]);

  const symbols = useMemo(() => {
    const norm = (language || 'c').toLowerCase();
    if (norm === 'python' || norm === 'py') return MOBILE_SYMBOLS_PYTHON;
    if (norm === 'sql') return MOBILE_SYMBOLS_SQL;
    if (norm === 'html') return MOBILE_SYMBOLS_HTML;
    if (norm === 'css') return MOBILE_SYMBOLS_CSS;
    if (norm === 'javascript' || norm === 'js') return MOBILE_SYMBOLS_JS;
    return MOBILE_SYMBOLS_C;
  }, [language]);

  return (
    <div
      className={cn(
        'flex flex-col h-full w-full overflow-hidden',
        isLight ? 'bg-white' : 'bg-[#090912]',
        !effectiveWordWrap && 'cm-nowrap',
        className
      )}
    >
      {showQuickBar && (
        <div className="flex flex-col bg-dark-900 border-b border-dark-700 shrink-0">
          {/* Copy / Paste / Mode / Undo / Redo Action Bar */}
          <div className="flex items-center justify-between px-2.5 py-1.5 gap-1.5 overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-dark-800 hover:bg-dark-700 border border-dark-700 text-gray-200 text-[11px] font-semibold transition active:scale-95 whitespace-nowrap"
                title="Copy selected code or all code"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 text-neb-500" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                type="button"
                onClick={handlePaste}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-dark-800 hover:bg-dark-700 border border-dark-700 text-gray-200 text-[11px] font-semibold transition active:scale-95 whitespace-nowrap"
                title="Paste code at cursor"
              >
                <ClipboardPaste className="h-3.5 w-3.5 text-emerald-500" />
                <span>Paste</span>
              </button>

              <button
                type="button"
                onClick={handleSelectAll}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-dark-800 hover:bg-dark-700 border border-dark-700 text-gray-300 text-[11px] font-medium transition active:scale-95 whitespace-nowrap"
                title="Select all code"
              >
                <CheckSquare className="h-3 w-3 text-gray-400" />
                <span>Select All</span>
              </button>

              {/* Desktop Mode (No Wrap / Horizontal Scroll like VS Code) vs Mobile Mode Toggle */}
              <button
                type="button"
                onClick={() => {
                  const next = !isMobileMode;
                  setMobileMode(next);
                  toast.success(
                    next
                      ? 'Mobile Mode: Line wrapping enabled'
                      : 'Desktop Mode: Horizontal scroll enabled (VS Code style)'
                  );
                }}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition active:scale-95 whitespace-nowrap',
                  !isMobileMode
                    ? 'bg-neb-600/15 border-neb-600/40 text-neb-400'
                    : 'bg-dark-800 hover:bg-dark-700 border-dark-700 text-gray-300'
                )}
                title={
                  isMobileMode
                    ? 'Switch to Desktop Mode (lines do not wrap, swipe horizontally like VS Code)'
                    : 'Switch to Mobile Mode (wrap long lines)'
                }
              >
                {isMobileMode ? (
                  <>
                    <Smartphone className="h-3.5 w-3.5 text-neb-400" />
                    <span>Mobile Mode</span>
                  </>
                ) : (
                  <>
                    <Monitor className="h-3.5 w-3.5 text-neb-400" />
                    <span>Desktop Mode</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleUndo}
                className="p-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 border border-dark-700 text-gray-300 transition active:scale-95"
                title="Undo"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={handleRedo}
                className="p-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 border border-dark-700 text-gray-300 transition active:scale-95"
                title="Redo"
              >
                <RotateCw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Mobile Quick Symbol Bar */}
          <div className="flex items-center gap-1 px-2 py-1 bg-dark-950 border-t border-dark-800 overflow-x-auto scrollbar-hide">
            {symbols.map((sym) => (
              <button
                key={sym}
                type="button"
                onClick={() => handleSymbolTap(sym)}
                className="px-2 py-1 rounded bg-dark-800 hover:bg-neb-900/40 active:bg-neb-700 text-gray-200 font-mono text-xs font-semibold border border-dark-700 shrink-0 transition active:scale-95"
              >
                {sym.trim() === '' ? 'Tab' : sym}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mobile Paste Fallback Box (when browser blocks direct clipboard read) */}
      {pasteModalOpen && (
        <div className="p-3 bg-dark-900 border-b border-neb-700/50 flex flex-col gap-2 animate-in fade-in duration-200 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <ClipboardPaste className="h-3.5 w-3.5 text-neb-400" />
              Long-press inside the box below to paste from your phone:
            </span>
            <button
              type="button"
              onClick={() => setPasteModalOpen(false)}
              className="p-1 text-gray-400 hover:text-white rounded"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <textarea
            value={pasteBuffer}
            onChange={(e) => setPasteBuffer(e.target.value)}
            placeholder="Long-press here and tap Paste..."
            rows={3}
            autoFocus
            className="w-full bg-dark-950 border border-dark-700 rounded-lg p-2.5 text-xs font-mono text-white focus:outline-none focus:border-neb-500"
          />
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setPasteModalOpen(false)}
              className="px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white border border-dark-700"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!pasteBuffer}
              onClick={() => {
                onChange(pasteBuffer);
                setPasteModalOpen(false);
                toast.success('Replaced editor code');
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-dark-800 hover:bg-dark-700 text-gray-200 border border-dark-600 disabled:opacity-40"
            >
              Replace All
            </button>
            <button
              type="button"
              disabled={!pasteBuffer}
              onClick={() => {
                insertTextAtCursor(pasteBuffer);
                setPasteModalOpen(false);
                toast.success('Inserted at cursor');
              }}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-neb-600 hover:bg-neb-500 text-white disabled:opacity-40"
            >
              Insert at Cursor
            </button>
          </div>
        </div>
      )}

      {/* CodeMirror 6 Editor */}
      <div className="flex-1 overflow-auto min-h-0 relative select-text">
        <CodeMirror
          ref={editorRef}
          value={value}
          height={height}
          theme={isLight ? 'light' : oneDark}
          extensions={extensions}
          onChange={(val) => onChange(val)}
          basicSetup={{
            lineNumbers: true,
            highlightActiveLineGutter: true,
            highlightSpecialChars: true,
            history: true,
            foldGutter: false,
            drawSelection: true,
            dropCursor: true,
            allowMultipleSelections: true,
            indentOnInput: true,
            syntaxHighlighting: true,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: true,
            rectangularSelection: true,
            crosshairCursor: false,
            highlightActiveLine: true,
            highlightSelectionMatches: true,
            closeBracketsKeymap: true,
            defaultKeymap: true,
            searchKeymap: true,
            historyKeymap: true,
            foldKeymap: false,
            completionKeymap: true,
            lintKeymap: true,
            tabSize: 4,
          }}
          className="h-full text-sm select-text"
        />
      </div>
    </div>
  );
}
