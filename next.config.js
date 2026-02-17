/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
      },
      {
        protocol: 'https',
        hostname: 'logo.clearbit.com',
      },
      {
        protocol: 'https',
        hostname: 'da5f663b4690-proxyimage.baby-beamup.club',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };

      // Add global polyfill for WebTorrent
      config.plugins.push(
        new (require('webpack')).DefinePlugin({
          'global': 'window',
        })
      );
    }

    // Ignore critical dependency warnings from webtorrent
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      { module: /node_modules\/fs-native-extensions/ },
      { module: /node_modules\/require-addon/ },
    ];

    return config;
  },
}

module.exports = nextConfig
