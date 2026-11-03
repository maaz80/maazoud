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
  async redirects() {
    return [
      {
        source: '/product/pack-of-2-indian-luxury-attars-\\(indian-oud-&-black-musk\\)',
        destination: '/product/pack-of-2-indian-luxury-attars-indian-oud-and-black-musk',
        permanent: true,
      },
      {
        source: '/product/pack-of-2-indian-luxury-attars-\\(mitti-e-hind-&-khas-vetiver\\)',
        destination: '/product/pack-of-2-indian-luxury-attars-mitti-e-hind-and-khas-vetiver',
        permanent: true,
      },
      {
        source: '/product/pack-of-3-indian-luxury-attars-\\(mitti-e-hind,-khas-vetiver-&-aqua-oud\\)',
        destination: '/category/combo-packs', // Redirect discontinued pack of 3 to combos category
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
        ],
      },
    ];
  },
};

export default nextConfig;
