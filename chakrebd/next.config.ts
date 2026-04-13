import type { NextConfig } from 'next';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
      // ImageBB hosted CV photos (next/image when used)
      { protocol: 'https', hostname: 'i.ibb.co', pathname: '/**' },
    ],
  },
};

export default nextConfig;
