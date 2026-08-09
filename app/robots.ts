import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/dashboard/',
        '/api/',
        '/auth/forgot-password',
        '/auth/reset-password',
        '/auth/verify-email',
        '/editor',
        '/mysql-lab'
      ],
    },
    sitemap: 'https://nebcode.ngwafrank.com/sitemap.xml',
  };
}
