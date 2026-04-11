import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("email_verifications", (t) => {
    t.renameColumn("token", "token_hash");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("email_verifications", (t) => {
    t.renameColumn("token_hash", "token");
  });
}
