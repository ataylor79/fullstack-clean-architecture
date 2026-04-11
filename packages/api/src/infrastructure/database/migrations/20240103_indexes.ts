import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("workouts", (t) => {
    t.index("user_id");
  });

  await knex.schema.alterTable("workout_sets", (t) => {
    t.index("workout_id");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("workout_sets", (t) => {
    t.dropIndex("workout_id");
  });

  await knex.schema.alterTable("workouts", (t) => {
    t.dropIndex("user_id");
  });
}
