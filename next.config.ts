import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    SUPABASE_URL: process.env.SUPABASE_URL || '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  },
  experimental: {
    serverComponentsExternalPackages: [
      "@supabase/supabase-js",
      "ai-sdk-provider-gemini-cli",
      "@google/gemini-cli"
    ],
  },
};

export default nextConfig;
