#!/usr/bin/env node
/**
 * Generate dynamic gym sitemap from API
 * Run this script on the server where API is accessible
 * Usage: node scripts/generate-gym-sitemap.js
 */

const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://neyofit.in';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.neyofit.in/api/v1';

async function generateGymSitemap() {
  console.log('Fetching gyms from API...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/gyms?status=published&limit=1000`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API responded with ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const gyms = data.data?.gyms || data.gyms || [];

    console.log(`Found ${gyms.length} published gyms`);

    const today = new Date().toISOString().split('T')[0];

    const urls = gyms.map(gym => ({
      url: `${BASE_URL}/gyms/${gym._id}`,
      lastmod: gym.updatedAt || today,
      changefreq: 'weekly',
      priority: 0.8,
    }));

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.map(u => `  <url>
    <loc>${u.url}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    // Write to public folder
    const publicDir = path.join(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    const outputPath = path.join(publicDir, 'sitemap-gyms.xml');
    fs.writeFileSync(outputPath, sitemap);
    console.log(`Gym sitemap generated at ${outputPath} with ${urls.length} URLs`);

  } catch (error) {
    console.error('Error generating gym sitemap:', error.message);
    process.exit(1);
  }
}

generateGymSitemap();