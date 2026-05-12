'use client';
import { X } from 'lucide-react';
import { FileNode } from '@/types';
import { cn } from '@/lib/utils';

interface Props {
  openFiles: FileNode[];
  activeFileId: string | null;
  onSelect: (f: FileNode) => void;
  onClose: (id: string) => void;
}

export function EditorTabs({ openFiles, activeFileId, onSelect, onClose }: Props) {
  if (openFiles.length === 0) return null;
  return (
    <div className="flex items-center border-b border-dark-700 bg-dark-800 overflow-x-auto">
      {openFiles.map(file => (
        <div
          key={file.id}
          onClick={() => onSelect(file)}
          className={cn(
            'flex items-center gap-2 px-3 py-2 text-xs font-mono border-r border-dark-700 cursor-pointer shrink-0 group transition-colors',
            activeFileId === file.id
              ? 'bg-dark-900 text-white border-t border-t-neb-500'
              : 'text-gray-500 hover:text-gray-300 hover:bg-dark-750'
          )}
        >
          <span>{file.name}</span>
          <button
            onClick={e => { e.stopPropagation(); onClose(file.id); }}
            className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity ml-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
}
