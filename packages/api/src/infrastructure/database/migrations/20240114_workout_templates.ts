import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("workout_templates", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("user_id")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    t.string("name").notNullable();
    t.string("difficulty").notNullable();
    t.string("type").notNullable();
    t.timestamp("created_at").defaultTo(knex.fn.now());
    t.timestamp("updated_at").defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("template_exercises", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("template_id")
      .notNullable()
      .references("id")
      .inTable("workout_templates")
      .onDelete("CASCADE");
    t.uuid("exercise_id")
      .notNullable()
      .references("id")
      .inTable("exercises")
      .onDelete("RESTRICT");
    t.string("section").notNullable().checkIn(["main", "warmup", "cooldown"]);
    t.integer("order_index").notNullable();
    t.timestamp("created_at").defaultTo(knex.fn.now());
    t.unique(["template_id", "section", "order_index"]);
  });

  await knex.schema.createTable("template_sets", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("template_exercise_id")
      .notNullable()
      .references("id")
      .inTable("template_exercises")
      .onDelete("CASCADE");
    t.integer("set_number").notNullable();
    t.string("set_type").notNullable();
    t.jsonb("details").notNullable().defaultTo("{}");
    t.text("notes").nullable();
    t.timestamp("created_at").defaultTo(knex.fn.now());
    t.timestamp("updated_at").defaultTo(knex.fn.now());
    t.unique(["template_exercise_id", "set_number"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("template_sets");
  await knex.schema.dropTableIfExists("template_exercises");
  await knex.schema.dropTableIfExists("workout_templates");
}
