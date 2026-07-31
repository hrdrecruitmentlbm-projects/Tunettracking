import type { NextConfig } from "next";

const version =
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.NEXT_PUBLIC_APP_VERSION ||
  (process.env.NODE_ENV === "development" ? "dev" : "0.0.0");

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: version,
  },
};

export default nextConfig;
