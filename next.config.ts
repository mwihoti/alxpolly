import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true
  },
 eslint: { 
  // allows productionbuilds
  ignoreDuringBuilds: true,
}
};

export default nextConfig;
