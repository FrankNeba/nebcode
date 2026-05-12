import { create } from 'zustand';
import { FileNode, ExecutionResult } from '@/types';

interface EditorState {
  files: FileNode[];
  activeFile: FileNode | null;
  output: ExecutionResult | null;
  wsOutput: string[];
  isRunning: boolean;
  showAnswer: boolean;
  terminalHeight: number;
  isTerminalMaximized: boolean;
  setFiles: (f: FileNode[]) => void;
  setActiveFile: (f: FileNode | null) => void;
  updateFileContent: (id: string, content: string) => void;
  setOutput: (o: ExecutionResult | null) => void;
  setWsOutput: (o: string[]) => void;
  appendWsOutput: (text: string) => void;
  setIsRunning: (v: boolean) => void;
  setTerminalHeight: (h: number) => void;
  setTerminalMaximized: (v: boolean) => void;
  isMobileMode: boolean;
  setMobileMode: (v: boolean) => void;
  toggleAnswer: () => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  files: [], activeFile: null, output: null, wsOutput: [], isRunning: false, showAnswer: false,
  terminalHeight: 180, isTerminalMaximized: false, isMobileMode: false,
  setFiles: (files) => set({ files }),
  setActiveFile: (activeFile) => set({ activeFile }),
  updateFileContent: (id, content) => set((s) => ({
    files: s.files.map(f => f.id === id ? { ...f, content } : f),
    activeFile: s.activeFile?.id === id ? { ...s.activeFile, content } : s.activeFile,
  })),
  setOutput: (output) => set({ output }),
  setWsOutput: (wsOutput) => set({ wsOutput }),
  appendWsOutput: (text) => set((s) => ({ wsOutput: [...s.wsOutput, text] })),
  setIsRunning: (isRunning) => set({ isRunning }),
  setTerminalHeight: (terminalHeight) => set({ terminalHeight }),
  setTerminalMaximized: (isTerminalMaximized) => set({ isTerminalMaximized }),
  setMobileMode: (isMobileMode) => set({ isMobileMode }),
  toggleAnswer: () => set((s) => ({ showAnswer: !s.showAnswer })),
}));
