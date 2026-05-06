import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("workouts", (t) => {
    t.uuid("plan_id")
      .nullable()
      .references("id")
      .inTable("workout_plans")
      .onDelete("SET NULL");
    t.integer("rating").nullable();
    t.text("notes").nullable();
  });

  await knex.raw(`
    ALTER TABLE workouts
    ADD CONSTRAINT workouts_rating_check CHECK (rating >= 1 AND rating <= 5)
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(
    `ALTER TABLE workouts DROP CONSTRAINT IF EXISTS workouts_rating_check`,
  );
  await knex.schema.alterTable("workouts", (t) => {
    t.dropColumn("notes");
    t.dropColumn("rating");
    t.dropColumn("plan_id");
  });
}
