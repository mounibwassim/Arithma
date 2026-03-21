/**
 * Script to add the role column to admin_credentials table
 * Run with: npx tsx scripts/add-role-column.ts
 */

import { drizzle } from "drizzle-orm/node-postgres";
import { config } from "dotenv";
import { sql } from "drizzle-orm";

// Load environment variables
config();

async function addRoleColumn() {
  if (!process.env.POSTGRES_URL) {
    console.error("❌ POSTGRES_URL environment variable is not set");
    process.exit(1);
  }

  const db = drizzle(process.env.POSTGRES_URL);

  try {
    console.log("📝 Adding role column to admin_credentials table...");

    // Add role column if it doesn't exist
    await db.execute(sql`
      ALTER TABLE admin_credentials 
      ADD COLUMN IF NOT EXISTS role varchar DEFAULT 'admin' NOT NULL
    `);

    console.log("✅ Role column added successfully!");
    console.log("   You can now run: npx tsx scripts/add-admin.ts");
  } catch (error: unknown) {
    console.error("❌ Error:", error);
    process.exit(1);
  }

  process.exit(0);
}

addRoleColumn();
