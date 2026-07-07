/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'fdfvzzqiyyhkowftegpl.supabase.co',
        pathname: '/storage/v1/**',
      },
    ],
    minimumCacheTTL: 31536000, // 1 year cache
  },
};

export default nextConfig;
