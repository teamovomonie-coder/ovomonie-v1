
import type {NextConfig} from 'next';
import path from 'path'

// Polyfill self for SSR
if (typeof globalThis.self === 'undefined') {
  (globalThis as any).self = globalThis;
}

const nextConfig: NextConfig = {
  experimental: {
    instrumentationHook: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  transpilePackages: [],
  generateBuildId: async () => {
    return 'build-' + Date.now();
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.postimg.cc',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
  webpack(config, { isServer }) {
    if (isServer) {
      config.resolve = config.resolve || {}
      config.resolve.alias = {
        ...(config.resolve.alias || {}),
        genkit: path.resolve(__dirname, 'src/__mocks__/genkit-client-stub.js'),
        '@genkit-ai/googleai': path.resolve(__dirname, 'src/__mocks__/genkit-googleai-stub.js'),
      }
      
      // Define self for server-side
      const webpack = require('webpack');
      config.plugins.push(
        new webpack.DefinePlugin({
          'self': 'globalThis',
        })
      );
    } else {
      config.resolve = config.resolve || {}
      config.resolve.alias = {
        ...(config.resolve.alias || {}),
        genkit: path.resolve(__dirname, 'src/__mocks__/genkit-client-stub.js'),
        '@genkit-ai/googleai': path.resolve(__dirname, 'src/__mocks__/genkit-googleai-stub.js'),
      }
    }

    return config
  },
};

export default nextConfig;
