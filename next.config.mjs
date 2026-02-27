/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://tower-map-back-end.vercel.app/api/:path*', 
      },
    ]
  },
}

export default nextConfig;
