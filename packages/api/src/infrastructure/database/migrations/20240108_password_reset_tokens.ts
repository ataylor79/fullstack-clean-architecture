import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("password_reset_tokens", (t) => {
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
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("password_reset_tokens");
}
