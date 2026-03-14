import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

const dbUrl = process.env.DATABASE_URL;
const useSSL = dbUrl.includes("ssl=true") || dbUrl.includes("sslmode=require");
const cleanUrl = dbUrl
  .replace(/[?&]ssl=true/g, "")
  .replace(/[?&]sslmode=require/g, "")
  .replace(/\?$/, "");

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: cleanUrl,
    ssl: useSSL ? { rejectUnauthorized: false } : undefined,
  },
});
