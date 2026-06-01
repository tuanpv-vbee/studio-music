/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(ttf|html)$/i,
      type: 'asset/resource'
    });
    return config;
  },
  experimental: {
    serverMinification: false, // the server minification unfortunately breaks the selector class names
    // Playwright is only used by the local browser-driven generate fallback and
    // cannot run on Vercel serverless. Keep it out of the server bundle and the
    // function file trace so deploys stay under the size limit.
    serverComponentsExternalPackages: ['playwright', 'playwright-core'],
    outputFileTracingExcludes: {
      '*': ['node_modules/playwright/**', 'node_modules/playwright-core/**'],
    },
  },
};

export default nextConfig;
