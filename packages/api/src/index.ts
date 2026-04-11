import "dotenv/config";
import { validateEnv } from "@infrastructure/config";
import { db } from "@infrastructure/database/db";
import { createApp } from "@presentation/app";

validateEnv();

const PORT = process.env.PORT ?? 3000;

async function main() {
  await db.migrate.latest();

  const app = createApp();
  app.listen(PORT, () => {
    console.log(`API running on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error("Failed to start server", err);
  process.exit(1);
});
