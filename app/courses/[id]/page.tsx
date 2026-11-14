import type { Metadata } from 'next';
import CourseDetailClient from './CourseDetailClient';

interface Props {
  params: { id: string };
}

async function getCourse(id: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://nebcodeback.ngwafrank.com';
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`${apiUrl}/api/v1/courses/${id}/`, {
      signal: controller.signal,
      next: { revalidate: 120 },
    });
    clearTimeout(timeout);
    if (res.ok) return await res.json();
  } catch (e) {
    // Fallback below
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`https://nebcodeback.ngwafrank.com/api/v1/courses/${id}/`, {
      signal: controller.signal,
      next: { revalidate: 120 },
    });
    clearTimeout(timeout);
    if (res.ok) return await res.json();
  } catch (e) {}

  return null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const course = await getCourse(params.id);
  const baseUrl = 'https://nebcode.ngwafrank.com';
  const title = course?.title ? `${course.title} — GCE Computer Science Course` : 'Course Details | Nebcode';
  const description =
    course?.description ||
    'Interactive hands-on C Programming and MySQL course for secondary school students with live compiler labs and exercises.';
  const shareSlug = course?.slug || params.id;
  const canonicalUrl = `${baseUrl}/courses/${shareSlug}`;

  let thumbnail = `${baseUrl}/logo.jpeg`;
  if (course?.thumbnail) {
    thumbnail = course.thumbnail.startsWith('http')
      ? course.thumbnail
      : `${baseUrl}${course.thumbnail.startsWith('/') ? '' : '/'}${course.thumbnail}`;
  }

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'Nebcode',
      images: [
        {
          url: thumbnail,
          width: 1200,
          height: 630,
          alt: course?.title || 'Course Thumbnail',
        },
      ],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [thumbnail],
    },
  };
}

export default async function CourseDetailPage({ params }: Props) {
  const course = await getCourse(params.id);
  const baseUrl = 'https://nebcode.ngwafrank.com';
  const shareSlug = course?.slug || params.id;

  const jsonLd = course
    ? {
        '@context': 'https://schema.org',
        '@type': 'Course',
        name: course.title,
        description: course.description,
        url: `${baseUrl}/courses/${shareSlug}`,
        provider: {
          '@type': 'EducationalOrganization',
          name: 'Nebcode',
          sameAs: baseUrl,
        },
        educationalLevel: 'Secondary School / GCE O-Level & A-Level',
        inLanguage: 'en',
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <CourseDetailClient id={params.id} initialCourse={course} />
    </>
  );
}
