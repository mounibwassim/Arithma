import { migrate } from "drizzle-orm/node-postgres/migrator";
import { join } from "node:path";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";

export const runMigrate = async () => {
  console.log("⏳ Running PostgreSQL migrations...");

  const migrationDb = drizzlePg((process.env.DIRECT_URL || process.env.DATABASE_URL || process.env.POSTGRES_URL)!);

  const start = Date.now();
  await migrate(migrationDb, {
    migrationsFolder: join(process.cwd(), "src/lib/db/migrations/pg"),
  }).catch((err) => {
    console.error(
      "❌ PostgreSQL migrations failed. check the postgres instance is running.",
      err.cause,
    );
    throw err;
  });
  const end = Date.now();

  console.log("✅ PostgreSQL migrations completed in", end - start, "ms");
};
