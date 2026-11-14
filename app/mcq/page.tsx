import { Metadata } from 'next';
import MCQPapersClient from './mcq-client';

export const metadata: Metadata = {
  title: 'GCE Computer Science MCQ Past Papers & Timed Practice Tests',
  description:
    'Practice 50-question GCE O-Level and A-Level Computer Science MCQ past papers under timed conditions. Get instant scores and step-by-step explanations.',
  alternates: {
    canonical: 'https://nebcode.ngwafrank.com/mcq',
  },
  openGraph: {
    title: 'Nebcode MCQ Past Papers — GCE Computer Science Exam Practice',
    description:
      'Practice 50-question GCE MCQ papers with timed fullscreen exams and detailed explanations on your phone or computer.',
    url: 'https://nebcode.ngwafrank.com/mcq',
    type: 'website',
  },
};

async function getInitialPapers() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://nebcodeback.ngwafrank.com';
  for (const base of [apiUrl, 'https://nebcodeback.ngwafrank.com']) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(`${base}/api/v1/mcq/papers/`, {
        signal: controller.signal,
        next: { revalidate: 120 },
      });
      clearTimeout(timeout);
      if (res.ok) {
        const data = await res.json();
        return Array.isArray(data) ? data : data.results || [];
      }
    } catch {
      // try fallback
    }
  }
  return [];
}

export default async function MCQPapersPage() {
  const initialPapers = await getInitialPapers();
  return <MCQPapersClient initialPapers={initialPapers} />;
}
