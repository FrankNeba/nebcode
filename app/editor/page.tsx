import { Metadata } from 'next';
import EditorPageClient from './editor-client';

export const metadata: Metadata = {
  title: 'Online C Compiler & Code Editor — Run C Programs in Browser',
  description: 'Write, compile, and run C programs directly in your browser with Nebcode\'s online C editor. Features a sandboxed file explorer, multi-file support, and instant output — no installation needed.',
  alternates: {
    canonical: '/editor',
  },
  openGraph: {
    title: 'Nebcode Online C Compiler — Code From Any Device',
    description: 'A full sandboxed C programming environment in your browser. Perfect for students learning C programming.',
    url: 'https://nebcode.ngwafrank.com/editor',
    type: 'website',
  },
};

export default function EditorPage() {
  return <EditorPageClient />;
}