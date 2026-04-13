import type { NextConfig } from 'next';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const r2ImageHost = process.env.NEXT_PUBLIC_R2_IMAGE_HOST?.trim();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  /** Parent repo has its own package-lock — pin tracing to this app folder. */
  outputFileTracingRoot: path.join(__dirname),
  /** Proxy API when `NEXT_PUBLIC_API_URL` is unset — browser calls `/api/v1/*` on the Next host (same-origin). */
  async rewrites() {
    const target = (process.env.API_PROXY_TARGET || 'http://127.0.0.1:4000').replace(/\/$/, '');
    return [{ source: '/api/v1/:path*', destination: `${target}/api/v1/:path*` }];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'picsum.photos', pathname: '/**' },
      // Legacy CV photos; new uploads use R2 (set NEXT_PUBLIC_R2_IMAGE_HOST to your *.r2.dev or CDN host)
      { protocol: 'https', hostname: 'i.ibb.co', pathname: '/**' },
      ...(r2ImageHost
        ? [{ protocol: 'https' as const, hostname: r2ImageHost, pathname: '/**' as const }]
        : []),
    ],
  },
};

export default nextConfig;
