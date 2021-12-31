/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  webpack: (config) => ({
    ...config,
    experiments: {
      ...config.experiments,
      asyncWebAssembly: true,
    },
  }),
};
