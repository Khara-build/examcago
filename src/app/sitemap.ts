import { MetadataRoute } from 'next';
import { createAdminClient } from '@/lib/supabase/admin';

export const revalidate = 86400; // Revalidate daily

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://examcago.com';
  const now = new Date();

  // Static Public URLs
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/subjects`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  // Fetch all active subjects for dynamic public URLs
  const dynamicSubjectRoutes: MetadataRoute.Sitemap = [];

  try {
    const adminClient = createAdminClient();
    const { data: subjects } = await adminClient
      .from('subjects')
      .select('slug, updated_at')
      .eq('is_active', true);

    if (subjects && subjects.length > 0) {
      subjects.forEach((sub) => {
        const lastMod = sub.updated_at ? new Date(sub.updated_at) : now;
        dynamicSubjectRoutes.push(
          {
            url: `${baseUrl}/subjects/${sub.slug}`,
            lastModified: lastMod,
            changeFrequency: 'weekly',
            priority: 0.85,
          },
          {
            url: `${baseUrl}/subjects/${sub.slug}/chapters`,
            lastModified: lastMod,
            changeFrequency: 'weekly',
            priority: 0.8,
          }
        );
      });
    }
  } catch (err) {
    console.error('[Sitemap Generation Error]:', err);
  }

  return [...staticRoutes, ...dynamicSubjectRoutes];
}
