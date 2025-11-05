/** @type {import('next').NextConfig} */

const fs = require('fs');
module.exports = {
  reactStrictMode: false,
  output: 'export',
  distDir: 'out',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
     config.resolve.fallback = { fs: false, net: false, tls: false };
    return config;
  },
}