import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Increase response timeout for long-running agentic chat loops
  httpAgentOptions: {
    keepAlive: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cfkovdyvmbnnyzihqanp.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // Expose server-side env vars — set these in .env.local
  env: {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY,
    FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY,
    DATAFORSEO_USERNAME: process.env.DATAFORSEO_USERNAME,
    DATAFORSEO_PASSWORD: process.env.DATAFORSEO_PASSWORD,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    REPLICATE_API_KEY: process.env.REPLICATE_API_KEY,
    FAL_API_KEY: process.env.FAL_API_KEY,
    FREEPIK_API_KEY: process.env.FREEPIK_API_KEY,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    N8N_BASE_URL: process.env.N8N_BASE_URL,
  },
};

export default nextConfig;
