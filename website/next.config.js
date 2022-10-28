/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  webpack: (config) => {
    config.module.rules.push({ test: /\.fin$/, type: 'asset/source' })
    return config
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
