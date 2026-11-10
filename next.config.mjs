/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ['@prisma/client', '@prisma/adapter-mariadb', 'mariadb', 'sharp', 'nodemailer'],
  // Only the site's own artwork goes through the optimizer. Its cache cannot see who is asking, so
  // member photos must never pass through it, or a cached copy would outlive a restriction.
  images: { formats: ['image/avif', 'image/webp'], localPatterns: [{ pathname: '/images/**', search: '' }] },
  // The Fees page was merged into Packages (Personalized Matchmaking); old links and bookmarks land there.
  async redirects() {
    return [{ source: '/fees', destination: '/packages#personalizedMatching', permanent: true }];
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
