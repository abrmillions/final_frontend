/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // Use Next.js image optimizations where possible
  },
  turbopack: {
    root: process.cwd(),
  },
}

export default nextConfig
