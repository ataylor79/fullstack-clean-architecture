import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("exercises", (t) => {
    t.text("exercise_category").notNullable().defaultTo("strength");
    t.text("muscle_group").nullable().alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("exercises", (t) => {
    t.dropColumn("exercise_category");
    t.text("muscle_group").notNullable().alter();
  });
}
