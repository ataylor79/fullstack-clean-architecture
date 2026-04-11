import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("exercises", (t) => {
    t.uuid("id").primary().defaultTo(knex.fn.uuid());
    t.string("name").notNullable();
    t.string("muscle_group").notNullable();
    t.text("notes").nullable();
    t.timestamps(true, true);
  });

  await knex.schema.createTable("workouts", (t) => {
    t.uuid("id").primary().defaultTo(knex.fn.uuid());
    t.string("name").notNullable();
    t.timestamp("scheduled_at").notNullable();
    t.timestamp("completed_at").nullable();
    t.timestamps(true, true);
  });

  await knex.schema.createTable("workout_sets", (t) => {
    t.uuid("id").primary().defaultTo(knex.fn.uuid());
    t.uuid("workout_id")
      .notNullable()
      .references("id")
      .inTable("workouts")
      .onDelete("CASCADE");
    t.uuid("exercise_id")
      .notNullable()
      .references("id")
      .inTable("exercises")
      .onDelete("RESTRICT");
    t.integer("set_number").notNullable();
    t.integer("reps").notNullable();
    t.decimal("weight_kg", 6, 2).notNullable();
    t.text("notes").nullable();
    t.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("workout_sets");
  await knex.schema.dropTableIfExists("workouts");
  await knex.schema.dropTableIfExists("exercises");
}
