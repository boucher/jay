/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  webpack: (config) => {
    config.module.rules.push({ test: /\.jay$/, type: 'asset/source' })
    config.module.rules.push({ test: /\.md$/, type: 'asset/source' })
    config.experiments.asyncWebAssembly = true
    return config
  },
}

module.exports = nextConfig
