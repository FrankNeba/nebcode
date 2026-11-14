import { Metadata } from 'next';
import CoursesPageClient from './courses-client';

export const metadata: Metadata = {
  title: 'GCE Computer Science, C Programming & MySQL Courses',
  description:
    'Explore structured C programming and MySQL database courses designed for Cameroon secondary school and GCE O/A-Level students. Practice with live compilers and interactive labs.',
  alternates: {
    canonical: 'https://nebcode.ngwafrank.com/courses',
  },
  openGraph: {
    title: 'Nebcode Courses — Master C Programming & MySQL Databases',
    description:
      'Step-by-step C programming and MySQL courses with live compiler sandboxes and hands-on exercises for secondary school students.',
    url: 'https://nebcode.ngwafrank.com/courses',
    type: 'website',
  },
};

async function getInitialCourses() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://nebcodeback.ngwafrank.com';
  for (const base of [apiUrl, 'https://nebcodeback.ngwafrank.com']) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(`${base}/api/v1/courses/`, {
        signal: controller.signal,
        next: { revalidate: 120 },
      });
      clearTimeout(timeout);
      if (res.ok) {
        const data = await res.json();
        return data.results || data || [];
      }
    } catch {
      // try fallback
    }
  }
  return [];
}

export default async function CoursesPage() {
  const initialCourses = await getInitialCourses();
  const baseUrl = 'https://nebcode.ngwafrank.com';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Nebcode C Programming & MySQL Courses',
    itemListElement: initialCourses.map((c: any, idx: number) => ({
      '@type': 'ListItem',
      position: idx + 1,
      url: `${baseUrl}/courses/${c.slug || c.id}`,
      name: c.title,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CoursesPageClient initialCourses={initialCourses} />
    </>
  );
}
