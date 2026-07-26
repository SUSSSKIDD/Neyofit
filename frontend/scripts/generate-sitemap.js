import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://neyofit.in';
const API_BASE_URL = 'https://api.neyofit.in';

const staticRoutes = [
  { url: '', changefreq: 'weekly', priority: 1.0 },
  { url: '/gyms', changefreq: 'daily', priority: 0.9 },
  { url: '/search', changefreq: 'daily', priority: 0.8 },
  { url: '/passes', changefreq: 'weekly', priority: 0.7 },
  { url: '/about', changefreq: 'monthly', priority: 0.6 },
  { url: '/faq', changefreq: 'monthly', priority: 0.6 },
  { url: '/partner', changefreq: 'monthly', priority: 0.5 },
  { url: '/terms', changefreq: 'yearly', priority: 0.3 },
  { url: '/login', changefreq: 'yearly', priority: 0.2 },
];

async function generateSitemap() {
  // In a real implementation, you'd fetch gym data from your API
  // For now, we'll generate static routes
  // You can extend this to fetch from your backend API
  
  const gymRoutes = [];
  // TODO: Fetch gyms from API and add their routes
  // Example:
  // const gyms = await fetch(`${API_BASE_URL}/api/v1/gyms?status=published&limit=1000`).then(r => r.json());
  // gyms.data.gyms.forEach(gym => {
  //   gymRoutes.push({
  //     url: `/gyms/${gym._id}`,
  //     changefreq: 'weekly',
  //     priority: 0.8,
  //     lastmod: gym.updatedAt
  //   });
  // });

  const allRoutes = [...staticRoutes, ...gymRoutes];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${allRoutes.map(route => `  <url>
    <loc>${BASE_URL}${route.url}</loc>
    <lastmod>${route.lastmod || new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  // Write to public folder for static serving
  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemap);
  console.log('Sitemap generated at public/sitemap.xml');

  // Also write to .next for dynamic serving if needed
  const nextDir = path.join(process.cwd(), '.next');
  if (fs.existsSync(nextDir)) {
    fs.writeFileSync(path.join(nextDir, 'sitemap.xml'), sitemap);
  }
}

generateSitemap().catch(console.error);