import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("workouts", (t) => {
   t.integer("duration_minutes").notNullable().defaultTo(0);
   t.enum("difficulty", ["beginner", "intermediate", "advanced", "elite"]).notNullable().defaultTo("beginner");
   t.enum("type", ["strength", "cardio", "hiit", "yoga", "pilates", "mobility", "hybrid"]).notNullable().defaultTo("strength");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("workouts", (t) => {
    t.dropColumn("duration_minutes");
    t.dropColumn("difficulty");
    t.dropColumn("type");
  });
}
