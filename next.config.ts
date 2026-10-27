import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Only used locally when MONGODB_URI is empty; keep it out of the bundle.
  serverExternalPackages: ["mongodb-memory-server"],
};

export default nextConfig;
