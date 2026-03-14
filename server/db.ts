import { Pool, PoolConfig } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

const dbUrl = process.env.DATABASE_URL || "";
const useSSL = dbUrl.includes("ssl=true") || dbUrl.includes("sslmode=require");

// Strip ssl params from the URL so pg doesn't try to verify the certificate,
// then re-add SSL config with rejectUnauthorized: false for RDS connections.
const cleanUrl = dbUrl
  .replace(/[?&]ssl=true/g, "")
  .replace(/[?&]sslmode=require/g, "")
  .replace(/\?$/, "");

const poolConfig: PoolConfig = {
  connectionString: cleanUrl,
};

if (useSSL) {
  poolConfig.ssl = { rejectUnauthorized: false };
}

const pool = new Pool(poolConfig);

export const db = drizzle(pool, { schema });

// Export pool config helper for other pg connections (e.g., session store)
export function getDbConnectionConfig() {
  return { connectionString: cleanUrl, ssl: useSSL ? { rejectUnauthorized: false } : undefined };
}
