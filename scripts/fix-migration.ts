import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import { Pool } from "pg";
import * as dotenv from "dotenv";
import * as fs from "node:fs";
import * as crypto from "node:crypto";
import * as path from "node:path";

// Load environment variables
dotenv.config();

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

const db = drizzle(pool);

async function fixMigration() {
  try {
    console.log("🔧 Checking migration status...");

    // Check current migrations
    const result = await db.execute(sql`
      SELECT hash, created_at 
      FROM drizzle."__drizzle_migrations" 
      ORDER BY created_at DESC
    `);

    console.log("Current migrations in database:");
    for (const row of result.rows) {
      console.log(
        `  - hash: ${(row as any).hash}, created_at: ${(row as any).created_at}`,
      );
    }

    // Calculate the hash for migration 0017
    const migrationPath = path.join(
      process.cwd(),
      "src/lib/db/migrations/pg/0017_bitter_sleepwalker.sql",
    );
    const migrationContent = fs.readFileSync(migrationPath, "utf-8");
    const hash = crypto
      .createHash("sha256")
      .update(migrationContent)
      .digest("hex");

    console.log(`\n📋 Migration 0017_bitter_sleepwalker hash: ${hash}`);

    // Check if this hash exists
    const existingHashes = result.rows.map((r: any) => r.hash);
    if (existingHashes.includes(hash)) {
      console.log("✅ Migration 0017 is already recorded in the database!");
    } else {
      console.log("⚠️ Migration 0017 is NOT in the database. Adding it now...");

      await db.execute(sql`
        INSERT INTO drizzle."__drizzle_migrations" (hash, created_at)
        VALUES (${hash}, ${1767545029796})
      `);

      console.log("✅ Migration marked as complete!");
    }

    // Final verification
    const verify = await db.execute(sql`
      SELECT COUNT(*) as count 
      FROM drizzle."__drizzle_migrations"
    `);
    console.log(
      `\n📊 Total migrations recorded: ${(verify.rows[0] as any).count}`,
    );
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await pool.end();
  }
}

fixMigration();
