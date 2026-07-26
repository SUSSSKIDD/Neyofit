import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://neyofit.in';

// Static routes that should be indexed
const staticRoutes = [
  '',
  '/about',
  '/faq',
  '/partner',
  '/terms',
  '/login',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/gyms',
  '/passes',
  '/search',
];

// Dynamic routes - in production, fetch from API
const dynamicRoutes = [
  // Gym detail pages would be generated from API data
  // e.g., `/gyms/gym-id-1`, `/gyms/gym-id-2`
];

function generateSitemap() {
  const today = new Date().toISOString().split('T')[0];
  
  const urls = staticRoutes.map(route => ({
    url: `${BASE_URL}${route}`,
    lastmod: today,
    changefreq: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1.0 : route === '/gyms' || route === '/search' ? 0.9 : 0.7,
  }));

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.map(u => `  <url>
    <loc>${u.url}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  const outputPath = path.join(process.cwd(), 'public', 'sitemap.xml');
  fs.writeFileSync(outputPath, sitemap);
  console.log(`Sitemap generated at ${outputPath} with ${urls.length} URLs`);
}

generateSitemap();
