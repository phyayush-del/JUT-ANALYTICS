/** @type {import('next').NextConfig} */
const nextConfig = {
  // This is the modern way to externalize packages in Next.js
  serverExternalPackages: ['@sparticuz/chromium'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      // This is the classic Webpack way to externalize packages
      config.externals = config.externals || [];
      config.externals.push('@sparticuz/chromium');
    }
    return config;
  },
};

module.exports = nextConfig;