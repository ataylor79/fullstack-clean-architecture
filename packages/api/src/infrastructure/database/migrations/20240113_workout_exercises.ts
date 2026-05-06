import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("workout_exercises", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("workout_id")
      .notNullable()
      .references("id")
      .inTable("workouts")
      .onDelete("CASCADE");
    t.uuid("exercise_id").notNullable().references("id").inTable("exercises");
    t.integer("order_index").notNullable();
    t.timestamp("created_at").defaultTo(knex.fn.now());
    t.unique(["workout_id", "order_index"]);
    t.unique(["workout_id", "exercise_id"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("workout_exercises");
}
