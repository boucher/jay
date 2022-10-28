/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  webpack: (config) => {
    config.module.rules.push({ test: /\.fin$/, type: 'asset/source' })
    return config
  },
}

module.exports = nextConfig
