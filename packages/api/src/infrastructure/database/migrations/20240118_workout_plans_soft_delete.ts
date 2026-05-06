import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("workout_plans", (t) => {
    t.timestamp("deleted_at").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("workout_plans", (t) => {
    t.dropColumn("deleted_at");
  });
}
