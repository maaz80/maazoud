/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'fdfvzzqiyyhxowftegpl.supabase.co',
      },
    ],
    minimumCacheTTL: 31536000, // 1 year cache
  },
};

export default nextConfig;
