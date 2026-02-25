/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://tower-map-back-end.vercel.app/api/:path*', // رابط الباك اند بتاعك
      },
    ]
  },
}

export default nextConfig;
