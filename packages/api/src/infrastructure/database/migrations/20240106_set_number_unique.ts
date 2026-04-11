import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("workout_sets", (t) => {
    t.unique(["workout_id", "set_number"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("workout_sets", (t) => {
    t.dropUnique(["workout_id", "set_number"]);
  });
}
