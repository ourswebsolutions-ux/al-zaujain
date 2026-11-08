export default function robots() {
  const base = process.env.SITE_URL || 'http://localhost:3000';
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/consultant', '/dashboard', '/manage', '/messages', '/api', '/login', '/reset-password'] },
    sitemap: `${base}/sitemap.xml`,
  };
}
