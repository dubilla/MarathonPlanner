import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

console.log("[DATABASE] Connection string configured:", !!connectionString);
console.log("[DATABASE] NODE_ENV:", process.env.NODE_ENV);

if (!connectionString && process.env.NODE_ENV !== "development") {
  throw new Error(
    "DATABASE_URL environment variable is required. Please check your environment variables."
  );
}

// Use a dummy connection string during build if not provided
const sql = neon(
  connectionString ||
    "postgresql://user:password@localhost:5432/dummy"
);

console.log("[DATABASE] Database connection initialized");

export const db = drizzle(sql, { schema });