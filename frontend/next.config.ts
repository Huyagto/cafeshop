// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  // Cấu hình images
  images: {
    // Các domain được phép load ảnh từ external
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '4000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: '**', // Cho phép tất cả domain trong dev (cẩn thận khi production)
      },
    ],
    // Định dạng ảnh hỗ trợ
    formats: ['image/avif', 'image/webp'],
    // Tối ưu ảnh trong production
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Cho phép unoptimized nếu cần
    unoptimized: process.env.NODE_ENV === 'development', // Tắt optimize trong dev để nhanh hơn
  },

  // Cấu hình API proxy nếu cần
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:4000/api/:path*', // Proxy đến backend
      },
    ];
  },

  // Cấu hình security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },

  // Cấu hình webpack
  webpack: (config, { isServer }) => {
    // Xử lý file upload
    config.module.rules.push({
      test: /\.(png|jpe?g|gif|webp|avif)$/i,
      use: [
        {
          loader: 'url-loader',
          options: {
            limit: 8192, // Dưới 8KB chuyển thành base64
            name: '[name].[hash].[ext]',
            outputPath: 'static/images/',
            publicPath: '/_next/static/images/',
          },
        },
      ],
    });

    return config;
  },

  // Cấu hình experimental
  experimental: {
    // Server Actions (nếu dùng Next.js 14+)
    serverActions: {
      bodySizeLimit: '2mb', // Tăng limit cho upload ảnh
    },
    // Tối ưu performance
    optimizeCss: true,
    scrollRestoration: true,
  },

  // Cấu hình compiler (nếu dùng styled-components hoặc emotion)
  compiler: {
    // styledComponents: true,
    // emotion: true,
  },

  // Cấu hình build output
  output: 'standalone', // Tối ưu cho Docker
  poweredByHeader: false, // Ẩn header X-Powered-By
  generateEtags: true,
  compress: true,

  // Cấu hình environment variables
  env: {
    API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:4000',
    UPLOAD_URL: process.env.UPLOAD_URL || 'http://localhost:4000/uploads',
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  },

  // Cấu hình transpile packages nếu cần
  transpilePackages: [],

  // Cấu hình page extensions
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],

  // Cấu hình i18n (nếu có đa ngôn ngữ)
 

  // Cấu hình trailing slash
  trailingSlash: false,

  // Cấu hình base path nếu deploy ở sub-path
  // basePath: '/admin',

  // Cấu hình asset prefix nếu CDN
  // assetPrefix: process.env.CDN_URL || '',
};

export default nextConfig;