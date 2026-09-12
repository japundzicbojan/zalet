import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@daytona/sdk",
    "form-data",
    "axios",
    "combined-stream",
    "delayed-stream",
  ],
};

export default nextConfig;
