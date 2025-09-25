/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  webpack: (config) => {
    // 🔹 Hilangkan warning "Critical dependency: the request of a dependency is an expression"
    config.module.exprContextCritical = false;
    return config;
  },
}

module.exports = nextConfig;

