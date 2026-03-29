import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Force Turbopack root to this app directory to avoid
    // resolving Prisma artifacts from a parent workspace.
    root: process.cwd(),
  },
};

export default nextConfig;
