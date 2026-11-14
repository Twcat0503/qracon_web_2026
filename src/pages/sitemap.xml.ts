import type { APIRoute } from 'astro';
import { getIndexablePaths } from '../utils/seo';
import { sitePath } from '../utils/paths';

const escapeXml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

export const GET: APIRoute = ({ site }) => {
  if (!site) {
    return new Response('Sitemap unavailable: Astro site is not configured.', { status: 500 });
  }

  const urls = getIndexablePaths()
    .map((path) => `  <url><loc>${escapeXml(new URL(sitePath(path), site).href)}</loc></url>`)
    .join('\n');

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
};
