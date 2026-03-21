/**
 * Script to add or update admin credentials in the database
 * Run with: npx tsx scripts/add-admin.ts
 */

import { drizzle } from "drizzle-orm/node-postgres";
import { hash } from "bcrypt-ts";
import { config } from "dotenv";
import { pgTable, uuid, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { sql, eq } from "drizzle-orm";

// Load environment variables
config();

// Define the table inline since we can't import from the project easily
const AdminCredentialsTable = pgTable("admin_credentials", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: varchar("role", { enum: ["admin", "super_admin"] })
    .notNull()
    .default("admin"),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  lastLoginAt: timestamp("last_login_at"),
});

async function addAdmin() {
  // Admin credentials - CHANGE THESE! After edit save the file and run 'npx tsx scripts/add-admin.ts' to update the admin credentials
  const ADMIN_USERNAME = "mounib";
  const ADMIN_PASSWORD = "Mounib$7"; // Change this to your desired password!
  const ADMIN_NAME = "M.W";
  const ADMIN_ROLE: "admin" | "super_admin" = "super_admin"; // Change to "admin" for regular admin

  if (!process.env.POSTGRES_URL) {
    console.error("❌ POSTGRES_URL environment variable is not set");
    process.exit(1);
  }

  const db = drizzle(process.env.POSTGRES_URL);

  try {
    console.log("🔐 Hashing password...");
    const hashedPassword = await hash(ADMIN_PASSWORD, 10);

    // Check if admin already exists
    const existing = await db
      .select()
      .from(AdminCredentialsTable)
      .where(eq(AdminCredentialsTable.username, ADMIN_USERNAME))
      .limit(1);

    if (existing.length > 0) {
      // Update existing admin password, name, and role
      console.log("📝 Updating admin credentials...");
      await db
        .update(AdminCredentialsTable)
        .set({
          password: hashedPassword,
          name: ADMIN_NAME,
          role: ADMIN_ROLE,
        })
        .where(eq(AdminCredentialsTable.username, ADMIN_USERNAME));
      console.log("✅ Admin credentials updated successfully!");
    } else {
      // Insert new admin
      console.log("📝 Adding admin credentials to database...");
      await db.insert(AdminCredentialsTable).values({
        username: ADMIN_USERNAME,
        password: hashedPassword,
        name: ADMIN_NAME,
        role: ADMIN_ROLE,
      });
      console.log("✅ Admin credentials added successfully!");
    }

    console.log(`   Username: ${ADMIN_USERNAME}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    console.log(`   Role: ${ADMIN_ROLE}`);
  } catch (error: unknown) {
    console.error("❌ Error:", error);
    process.exit(1);
  }

  process.exit(0);
}

addAdmin();
