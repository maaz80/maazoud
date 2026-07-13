/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    dangerouslyAllowLocalIP: true,
    qualities: [60, 75],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'fdfvzzqiyyhxowftegpl.supabase.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
        port: '',
        pathname: '/**',
      },
    ],
    minimumCacheTTL: 31536000, // 1 year cache
  },
};

export default nextConfig;
