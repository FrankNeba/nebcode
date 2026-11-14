'use client';
import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';
import { cn } from '@/lib/utils';

interface KatexRendererProps {
  content: string;
  className?: string;
  inline?: boolean;
}

/**
 * Normalizes LaTeX delimiters \( ... \) and \[ ... \] to $ ... $ and $$ ... $$
 * so remark-math and rehype-katex render all standard math formats seamlessly.
 */
function normalizeMathDelimiters(text: string): string {
  if (!text) return '';
  return text
    .replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => `$$${math}$$`)
    .replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => `$${math}$`);
}

export function KatexRenderer({ content, className, inline = false }: KatexRendererProps) {
  const processed = useMemo(() => normalizeMathDelimiters(content || ''), [content]);

  if (!processed) return null;

  return (
    <div
      className={cn(
        'prose prose-invert prose-sm max-w-none leading-relaxed break-words overflow-x-auto',
        'prose-p:my-1 prose-headings:text-white prose-strong:text-white',
        'prose-code:text-neb-300 prose-code:bg-dark-900 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs',
        'prose-pre:bg-dark-950 prose-pre:border prose-pre:border-dark-800 prose-pre:rounded-xl prose-pre:p-3',
        '[&_.katex-display]:overflow-x-auto [&_.katex-display]:overflow-y-hidden [&_.katex-display]:py-1',
        inline && '[&_p]:inline [&_p]:m-0',
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex, rehypeRaw as any]}
      >
        {processed}
      </ReactMarkdown>
    </div>
  );
}
