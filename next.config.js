/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['puppeteer-core', '@sparticuz/chromium-min'],
  outputFileTracingIncludes: {
    '/api/**/*': [
      'node_modules/@sparticuz/chromium-min/bin/**/*',
      'node_modules/@sparticuz/chromium-min/bin',
      'node_modules/puppeteer-core/**/*',
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        kerberos: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;