import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    // imaginile paginilor nu se schimbă: cache lung
    return ["/pages/:path*", "/pages-hd/:path*", "/thumbs/:path*", "/textures/:path*"].map((source) => ({
      source,
      headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
    }));
  },
};

export default nextConfig;
