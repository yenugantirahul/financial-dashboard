import type { NextConfig } from "next";

const rawBackendBase =
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.BACKEND_URL;

const backendBase =
  typeof rawBackendBase === "string" && rawBackendBase.trim().length > 0
    ? rawBackendBase.replace(/\/+$/, "")
    : undefined;

const nextConfig: NextConfig = {
  async rewrites() {
    if (!backendBase) {
      return [];
    }

    return [
      {
        source: "/api/:path*",
        destination: `${backendBase}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
