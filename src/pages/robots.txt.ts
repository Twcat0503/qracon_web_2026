import type { APIRoute } from 'astro';
import { sitePath } from '../utils/paths';

export const GET: APIRoute = ({ site }) => {
  if (!site) {
    return new Response('Robots unavailable: Astro site is not configured.', { status: 500 });
  }

  const body = `User-agent: *
Allow: ${new URL(sitePath('/'), site).pathname}

Sitemap: ${new URL(sitePath('/sitemap.xml'), site).href}
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
