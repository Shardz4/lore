import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@lore/crypto-utils"],
  experimental: {
    externalDir: true,
  },
};

export default nextConfig;
