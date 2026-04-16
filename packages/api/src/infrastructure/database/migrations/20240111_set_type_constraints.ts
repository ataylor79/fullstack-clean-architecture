import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Drop old (workout_id, set_number) unique constraint
  await knex.schema.alterTable("workout_sets", (t) => {
    t.dropUnique(["workout_id", "set_number"]);
  });

  // Make exercise_id NOT NULL (all set types now require an exercise)
  await knex.schema.alterTable("workout_sets", (t) => {
    t.uuid("exercise_id").notNullable().alter();
  });

  // Add per-exercise unique constraint
  await knex.schema.alterTable("workout_sets", (t) => {
    t.unique(["workout_id", "exercise_id", "set_number"]);
  });

  // Drop top-level columns whose data lives in the details JSONB
  await knex.schema.alterTable("workout_sets", (t) => {
    t.dropColumn("reps");
    t.dropColumn("weight_kg");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("workout_sets", (t) => {
    t.integer("reps").nullable();
    t.decimal("weight_kg", 6, 2).nullable();
  });

  await knex.schema.alterTable("workout_sets", (t) => {
    t.dropUnique(["workout_id", "exercise_id", "set_number"]);
  });

  await knex.schema.alterTable("workout_sets", (t) => {
    t.uuid("exercise_id").nullable().alter();
  });

  await knex.schema.alterTable("workout_sets", (t) => {
    t.unique(["workout_id", "set_number"]);
  });
}
