/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  turbopack: {
    // Ensure Turbopack uses this project root (avoid parent lockfile confusion).
    root: __dirname,
  },
};

module.exports = nextConfig;
