import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@daytonaio/sdk", "@daytona/sdk", "form-data", "axios"],
};

export default nextConfig;
