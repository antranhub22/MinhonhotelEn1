import pg from 'pg';
const { Pool } = pg;
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Debug: print out the final connection string
console.log('⏳ Connecting to database with URL:', process.env.DATABASE_URL);

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Internal VPC connection typically does not require SSL
  ssl: { rejectUnauthorized: false }
});
export const db = drizzle(pool, { schema });
