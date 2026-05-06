import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE workouts
    ALTER COLUMN duration_minutes DROP NOT NULL,
    ALTER COLUMN duration_minutes DROP DEFAULT
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    UPDATE workouts SET duration_minutes = 0 WHERE duration_minutes IS NULL;
    ALTER TABLE workouts
    ALTER COLUMN duration_minutes SET NOT NULL,
    ALTER COLUMN duration_minutes SET DEFAULT 0
  `);
}
