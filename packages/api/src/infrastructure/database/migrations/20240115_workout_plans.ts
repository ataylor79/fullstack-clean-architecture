import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("workout_plans", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("user_id")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    t.uuid("template_id")
      .notNullable()
      .references("id")
      .inTable("workout_templates")
      .onDelete("RESTRICT");
    t.jsonb("days_of_week").notNullable();
    t.integer("num_weeks").notNullable();
    t.timestamp("created_at").defaultTo(knex.fn.now());
    t.timestamp("updated_at").defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("workout_plans");
}
