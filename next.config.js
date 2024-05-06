const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    config.externals.push("pino-pretty");
    return config;
  },
  compiler: {
    styledComponents: true,
  },
  experimental: {
    windowHistorySupport: true,
  },
};

module.exports = nextConfig;
