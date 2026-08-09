import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://nebcode.ngwafrank.com';

  // Base static routes
  const routes = [
    '',
    '/courses',
    '/pricing',
    '/auth/login',
    '/auth/register',
  ];

  const staticUrls = routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  // Fetch courses from the API to generate dynamic sitemap entries
  let courseUrls: MetadataRoute.Sitemap = [];
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8003';
    // We fetch with a timeout/abort controller or short timeout to avoid blocking builds
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(`${apiUrl}/api/v1/courses/`, {
      signal: controller.signal,
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    clearTimeout(id);

    if (res.ok) {
      const data = await res.json();
      const courses = data.results || data || [];
      courseUrls = courses.map((course: any) => ({
        url: `${baseUrl}/courses/${course.id}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }));
    }
  } catch (error) {
    console.error('Failed to fetch courses for sitemap:', error);
  }

  return [...staticUrls, ...courseUrls];
}
