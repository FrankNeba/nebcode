'use client';
import { useState } from 'react';
import {
  File, Folder, FolderOpen, Plus, FolderPlus, Trash2, Edit2, Check, X, Download
} from 'lucide-react';
import { FileNode } from '@/types';
import { cn } from '@/lib/utils';
import Cookies from 'js-cookie';

interface Props {
  nodes: FileNode[];
  activeFileId: string | null;
  onSelectFile: (node: FileNode) => void;
  onCreateFile: (parentId: string | null, name: string) => void;
  onCreateFolder: (parentId: string | null, name: string) => void;
  onDelete: (node: FileNode) => void;
  onRename: (node: FileNode, name: string) => void;
}

interface NodeRowProps extends Props {
  node: FileNode;
  depth: number;
}

function NodeRow({ node, depth, activeFileId, onSelectFile, onCreateFile, onCreateFolder, onDelete, onRename }: NodeRowProps) {
  const [expanded, setExpanded] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(node.name);
  const [creating, setCreating] = useState<null | 'file' | 'folder'>(null);
  const [newName, setNewName] = useState('');

  const isFolder = node.node_type === 'folder';
  const isActive = activeFileId === node.id;

  const commitRename = () => {
    if (editName.trim()) onRename(node, editName.trim());
    setEditing(false);
  };

  const commitCreate = () => {
    if (newName.trim() && creating) {
      if (creating === 'file') onCreateFile(node.id, newName.trim());
      else onCreateFolder(node.id, newName.trim());
    }
    setCreating(null);
    setNewName('');
  };

  return (
    <div>
      <div
        className={cn(
          'group flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer text-sm select-none transition-colors',
          isActive && !isFolder ? 'bg-neb-700/40 text-neb-300' : 'text-gray-400 hover:text-white hover:bg-dark-700'
        )}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
        onClick={() => {
          if (isFolder) setExpanded(!expanded);
          else onSelectFile(node);
        }}
      >
        {isFolder
          ? expanded ? <FolderOpen className="h-3.5 w-3.5 text-neb-400 shrink-0" /> : <Folder className="h-3.5 w-3.5 text-neb-400 shrink-0" />
          : <File className="h-3.5 w-3.5 text-gray-500 shrink-0" />
        }

        {editing ? (
          <input
            autoFocus
            value={editName}
            onChange={e => setEditName(e.target.value)}
            onBlur={commitRename}
            onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setEditing(false); }}
            className="flex-1 bg-dark-600 text-white text-xs px-1 py-0.5 rounded outline-none border border-neb-500"
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <span className="flex-1 truncate font-mono text-xs">{node.name}</span>
        )}

        {/* Actions (always visible on mobile, hover on desktop) */}
        <div className="flex md:hidden group-hover:flex items-center gap-0.5 ml-auto" onClick={e => e.stopPropagation()}>
          {isFolder && (
            <>
              <button onClick={() => { 
                const token = Cookies.get('access_token');
                window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/code-sessions/files/download/${node.id}/?token=${token}`;
              }} className="p-0.5 rounded hover:bg-dark-500 text-gray-500 hover:text-neb-400" title="Download folder (ZIP)">
                <Download className="h-3 w-3" />
              </button>
              <button onClick={() => { setCreating('file'); setExpanded(true); }} className="p-0.5 rounded hover:bg-dark-500 text-gray-500 hover:text-neb-400" title="New file">
                <Plus className="h-3 w-3" />
              </button>
              <button onClick={() => { setCreating('folder'); setExpanded(true); }} className="p-0.5 rounded hover:bg-dark-500 text-gray-500 hover:text-neb-400" title="New folder">
                <FolderPlus className="h-3 w-3" />
              </button>
            </>
          )}
          <button onClick={() => setEditing(true)} className="p-0.5 rounded hover:bg-dark-500 text-gray-500 hover:text-neb-400" title="Rename">
            <Edit2 className="h-3 w-3" />
          </button>
          <button onClick={() => onDelete(node)} className="p-0.5 rounded hover:bg-dark-500 text-gray-500 hover:text-red-400" title="Delete">
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Inline create input */}
      {creating && (
        <div className="flex items-center gap-1 px-2 py-1" style={{ paddingLeft: `${8 + (depth + 1) * 14}px` }}>
          {creating === 'file' ? <File className="h-3.5 w-3.5 text-gray-500 shrink-0" /> : <Folder className="h-3.5 w-3.5 text-neb-400 shrink-0" />}
          <input
            autoFocus
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onBlur={commitCreate}
            onKeyDown={e => { if (e.key === 'Enter') commitCreate(); if (e.key === 'Escape') { setCreating(null); setNewName(''); } }}
            placeholder={creating === 'file' ? 'filename.c' : 'folder-name'}
            className="flex-1 bg-dark-600 text-white text-xs px-1 py-0.5 rounded outline-none border border-neb-500 font-mono"
          />
        </div>
      )}

      {/* Children */}
      {isFolder && expanded && node.children?.map(child => (
        <NodeRow
          key={child.id}
          node={child}
          depth={depth + 1}
          activeFileId={activeFileId}
          onSelectFile={onSelectFile}
          onCreateFile={onCreateFile}
          onCreateFolder={onCreateFolder}
          onDelete={onDelete}
          onRename={onRename}
          nodes={[]}
        />
      ))}
    </div>
  );
}

export function FileExplorer({ nodes, activeFileId, onSelectFile, onCreateFile, onCreateFolder, onDelete, onRename }: Props) {
  const [rootCreating, setRootCreating] = useState<null | 'file' | 'folder'>(null);
  const [rootNewName, setRootNewName] = useState('');

  const commitRoot = () => {
    if (rootNewName.trim() && rootCreating) {
      if (rootCreating === 'file') onCreateFile(null, rootNewName.trim());
      else onCreateFolder(null, rootNewName.trim());
    }
    setRootCreating(null);
    setRootNewName('');
  };

  return (
    <div className="flex flex-col h-full bg-dark-900 border-r border-dark-700 w-52 shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-dark-700">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Explorer</span>
        <div className="flex gap-1">
          <button onClick={() => {
            const token = Cookies.get('access_token');
            window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/code-sessions/files/download/?token=${token}`;
          }} className="p-1 rounded hover:bg-dark-600 text-gray-500 hover:text-neb-400" title="Download workspace (ZIP)">
            <Download className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => { setRootCreating('file'); setRootNewName(''); }} className="p-1 rounded hover:bg-dark-600 text-gray-500 hover:text-neb-400" title="New file">
            <Plus className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => { setRootCreating('folder'); setRootNewName(''); }} className="p-1 rounded hover:bg-dark-600 text-gray-500 hover:text-neb-400" title="New folder">
            <FolderPlus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {nodes.map(node => (
          <NodeRow
            key={node.id} node={node} depth={0}
            activeFileId={activeFileId}
            onSelectFile={onSelectFile}
            onCreateFile={onCreateFile}
            onCreateFolder={onCreateFolder}
            onDelete={onDelete}
            onRename={onRename}
            nodes={[]}
          />
        ))}

        {rootCreating && (
          <div className="flex items-center gap-1 px-2 py-1 mt-0.5">
            {rootCreating === 'file' ? <File className="h-3.5 w-3.5 text-gray-500 shrink-0" /> : <Folder className="h-3.5 w-3.5 text-neb-400 shrink-0" />}
            <input
              autoFocus value={rootNewName}
              onChange={e => setRootNewName(e.target.value)}
              onBlur={commitRoot}
              onKeyDown={e => { if (e.key === 'Enter') commitRoot(); if (e.key === 'Escape') { setRootCreating(null); setRootNewName(''); } }}
              placeholder={rootCreating === 'file' ? 'main.c' : 'folder'}
              className="flex-1 bg-dark-600 text-white text-xs px-1 py-0.5 rounded outline-none border border-neb-500 font-mono"
            />
          </div>
        )}

        {nodes.length === 0 && !rootCreating && (
          <div className="px-3 py-4 text-center">
            <p className="text-xs text-gray-600">No files yet</p>
            <p className="text-xs text-gray-700 mt-1">Click + to create</p>
          </div>
        )}
      </div>
    </div>
  );
}
