import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("workout_exercises", (t) => {
    t.string("section").notNullable().defaultTo("main");
  });

  await knex.raw(`
    ALTER TABLE workout_exercises
    ADD CONSTRAINT workout_exercises_section_check
    CHECK (section IN ('main', 'warmup', 'cooldown'))
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE workout_exercises DROP CONSTRAINT IF EXISTS workout_exercises_section_check
  `);
  await knex.schema.alterTable("workout_exercises", (t) => {
    t.dropColumn("section");
  });
}
