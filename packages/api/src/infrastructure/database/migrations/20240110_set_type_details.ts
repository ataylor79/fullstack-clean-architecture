import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("workout_sets", (t) => {
    t.text("set_type").notNullable().defaultTo("strength");
    t.jsonb("details").notNullable().defaultTo("{}");
    t.integer("reps").nullable().alter();
    t.decimal("weight_kg", 6, 2).nullable().alter();
    t.uuid("exercise_id").nullable().alter();
  });

  // Backfill existing strength rows into the details column
  await knex.raw(`
    UPDATE workout_sets
    SET details = jsonb_build_object(
      'reps', reps,
      'weightKg', weight_kg::float,
      'restSeconds', NULL
    )
    WHERE set_type = 'strength'
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("workout_sets", (t) => {
    t.dropColumn("set_type");
    t.dropColumn("details");
    t.integer("reps").notNullable().alter();
    t.decimal("weight_kg", 6, 2).notNullable().alter();
    t.uuid("exercise_id").notNullable().alter();
  });
}
