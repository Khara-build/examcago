import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://examcago.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/subjects',
          '/subjects/*',
          '/about',
          '/contact',
          '/privacy',
          '/terms',
          '/login',
          '/register',
        ],
        disallow: [
          '/dashboard/',
          '/admin/',
          '/exam/',
          '/auth/',
          '/_next/',
          '/api/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
