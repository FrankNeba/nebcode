import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://nebcode.ngwafrank.com';

  const routes = [
    '',
    '/courses',
    '/mcq',
    '/web-lab',
    '/excel-lab',
    '/pricing',
    '/contact',
    '/ambassador',
    '/auth/login',
    '/auth/register',
  ];

  const staticUrls: MetadataRoute.Sitemap = routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' || route === '/courses' || route === '/mcq' ? 'daily' : 'weekly',
    priority: route === '' ? 1.0 : route === '/courses' || route === '/mcq' ? 0.9 : 0.7,
  }));

  let courseUrls: MetadataRoute.Sitemap = [];
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://nebcodeback.ngwafrank.com';

  for (const endpoint of [apiUrl, 'https://nebcodeback.ngwafrank.com']) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(`${endpoint}/api/v1/courses/`, {
        signal: controller.signal,
        next: { revalidate: 3600 },
      });

      clearTimeout(id);

      if (res.ok) {
        const data = await res.json();
        const courses = data.results || data || [];
        courseUrls = courses.map((course: any) => ({
          url: `${baseUrl}/courses/${course.slug || course.id}`,
          lastModified: new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.85,
        }));
        break;
      }
    } catch {
      // Try fallback endpoint
    }
  }

  return [...staticUrls, ...courseUrls];
}
