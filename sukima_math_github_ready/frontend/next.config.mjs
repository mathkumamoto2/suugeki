/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { dev }) => {
    // Final Stable: avoid Windows + Node/V8 + Webpack pack cache crash.
    if (dev) {
      config.cache = false;
    }
    return config;
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
