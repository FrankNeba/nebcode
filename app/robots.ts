import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/courses', '/mcq', '/pricing', '/contact', '/ambassador'],
        disallow: [
          '/dashboard/',
          '/admin/',
          '/api/',
          '/auth/forgot-password',
          '/auth/reset-password',
          '/auth/verify-email',
          '/editor',
          '/mysql-lab',
          '/mcq/*',
        ],
      },
    ],
    host: 'https://nebcode.ngwafrank.com',
    sitemap: 'https://nebcode.ngwafrank.com/sitemap.xml',
  };
}
