module.exports = {
  // Force Puppeteer to download Chrome during install
  chrome: {
    skipDownload: false,
  },
  // Set cache directory to a writable location for Vercel
  cacheDirectory: './.cache/puppeteer',
};