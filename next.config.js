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
      {
        protocol: 'https',
        hostname: '1.embedcanaisdetv.com',
      },
      {
        protocol: 'https',
        hostname: 'api.reidoscanais.st',
      },
      {
        protocol: 'https',
        hostname: 'd1muf25xaso8hp.cloudfront.net',
      },
    ],
  },
  // Configurações para PWA
  async headers() {
    return [
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
      {
        source: '/:all*(svg|jpg|png|webp)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
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

    // Suppress "Critical dependency" warnings from WebTorrent native modules
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      { module: /node_modules[\\/]fs-native-extensions/ },
      { module: /node_modules[\\/]require-addon/ },
    ];

    return config;
  },
}

module.exports = nextConfig
