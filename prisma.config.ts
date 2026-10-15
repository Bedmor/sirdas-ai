import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Prefer DIRECT TCP via DIRECT_URL (Supabase port 5432) or DATABASE_URL
    url: process.env.DIRECT_URL || (process.env.DATABASE_URL ? env("DATABASE_URL") : undefined),
  },
});
