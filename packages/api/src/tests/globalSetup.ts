import { execSync } from "child_process";
import path from "path";

export async function setup() {
  const apiRoot = path.resolve(__dirname, "../..");
  execSync(
    "node -r tsx/cjs ./node_modules/knex/bin/cli.js migrate:latest --knexfile src/infrastructure/database/dbConfig.ts",
    {
      cwd: apiRoot,
      env: { ...process.env, NODE_ENV: "test" },
      stdio: "inherit",
    }
  );
}
