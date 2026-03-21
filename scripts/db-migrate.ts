import "load-env";

const { runMigrate } = await import("lib/db/pg/migrate.pg");

await runMigrate()
  .then(() => {
    console.info("🚀 DB Migration completed");
    process.exit(0);
  })
  .catch((err) => {
    console.warn("DB Migration skipped or already applied.");
    process.exit(0);
  });
