import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ["outage-upon-joining.ngrok-free.dev", "metro-tuner-prague-evans.trycloudflare.com"],
  reactStrictMode: false,
};

export default nextConfig;
