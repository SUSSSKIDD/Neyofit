/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://neyofit.in',
  generateRobotsTxt: true,
  generateIndexSitemap: true,
  exclude: [
    '/customer',
    '/customer/*',
    '/gym',
    '/gym/*',
    '/platform',
    '/platform/*',
    '/login',
    '/checkout',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
    '/api/*',
  ],
  robotsTxtOptions: {
    policies: [
      { userAgent: '*', allow: '/' },
      { userAgent: '*', disallow: ['/customer/', '/gym/', '/platform/', '/login', '/checkout', '/api/'] }
    ],
    additionalSitemaps: ['https://neyofit.in/sitemap-gyms.xml']
  },
  transform: async (config, path) => {
    // Add priority and changefreq for key pages
    const priorities = {
      '/': 1.0,
      '/gyms': 0.9,
      '/search': 0.9,
      '/passes': 0.8,
      '/about': 0.6,
      '/faq': 0.6,
      '/partner': 0.5,
      '/terms': 0.3,
      '/login': 0.2,
    }
    const changefreq = {
      '/': 'daily',
      '/gyms': 'daily',
      '/search': 'daily',
      '/passes': 'weekly',
      '/about': 'monthly',
      '/faq': 'monthly',
      '/partner': 'monthly',
      '/terms': 'yearly',
      '/login': 'yearly',
    }
    return {
      loc: path,
      changefreq: changefreq[path] || 'weekly',
      priority: priorities[path] || 0.7,
      lastmod: new Date().toISOString(),
      alternateRefs: config.alternateRefs ?? [],
    }
  },
}