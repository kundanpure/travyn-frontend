import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["172.20.10.2", "192.168.*.*", "172.*.*.*", "10.*.*.*"],
  turbopack: {
    root: path.resolve(__dirname),
  },
  transpilePackages: ["@stomp/stompjs", "sockjs-client"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
