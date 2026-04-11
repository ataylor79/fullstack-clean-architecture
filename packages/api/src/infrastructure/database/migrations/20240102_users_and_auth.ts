import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("users", (t) => {
    t.uuid("id").primary().defaultTo(knex.fn.uuid());
    t.string("email").notNullable().unique();
    t.string("password_hash").notNullable();
    t.timestamp("email_verified_at").nullable();
    t.timestamps(true, true);
  });

  await knex.schema.alterTable("workouts", (t) => {
    t.uuid("user_id")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE")
      .defaultTo(knex.raw("gen_random_uuid()"));
  });

  // Remove the defaultTo after adding the column (it was only needed for existing rows)
  await knex.schema.alterTable("workouts", (t) => {
    t.uuid("user_id").notNullable().alter();
  });

  await knex.schema.createTable("refresh_tokens", (t) => {
    t.uuid("id").primary().defaultTo(knex.fn.uuid());
    t.uuid("user_id")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    t.string("token_hash").notNullable().unique();
    t.timestamp("expires_at").notNullable();
    t.timestamps(true, true);
  });

  await knex.schema.createTable("email_verifications", (t) => {
    t.uuid("id").primary().defaultTo(knex.fn.uuid());
    t.uuid("user_id")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    t.string("token").notNullable().unique();
    t.timestamp("expires_at").notNullable();
    t.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("email_verifications");
  await knex.schema.dropTableIfExists("refresh_tokens");
  await knex.schema.alterTable("workouts", (t) => {
    t.dropColumn("user_id");
  });
  await knex.schema.dropTableIfExists("users");
}
