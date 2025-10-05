import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

console.log("[DATABASE] Connection string configured:", !!connectionString);
console.log("[DATABASE] NODE_ENV:", process.env.NODE_ENV);

// Use WebSocket-based connection pool for full PostgreSQL feature support
const pool = new Pool({
  connectionString:
    connectionString || "postgresql://user:password@localhost:5432/dummy",
});

console.log("[DATABASE] Database connection initialized with WebSocket driver");

export const db = drizzle(pool, { schema });
