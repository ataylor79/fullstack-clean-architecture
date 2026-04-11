import path from "node:path";
import type { Knex } from "knex";

const migrationsDir = path.join(__dirname, "migrations");
const seedsDir = path.join(__dirname, "seeds");

const config: Record<string, Knex.Config> = {
  development: {
    client: "pg",
    connection:
      process.env.DATABASE_URL ??
      "postgresql://workout:workout@localhost:5432/workout",
    migrations: {
      directory: migrationsDir,
      extension: "ts",
    },
    seeds: {
      directory: seedsDir,
    },
  },
  test: {
    client: "pg",
    connection:
      process.env.TEST_DATABASE_URL ??
      "postgresql://workout:workout@localhost:5432/workout_test",
    migrations: {
      directory: migrationsDir,
      extension: "ts",
    },
  },
  production: {
    client: "pg",
    connection: process.env.DATABASE_URL,
    migrations: {
      directory: migrationsDir,
    },
    pool: { min: 2, max: 10 },
  },
};

export default config;
