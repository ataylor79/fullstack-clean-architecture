import type { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  await knex("exercises").del();
  await knex("exercises").insert([
    { name: "Squat", muscle_group: "Legs" },
    { name: "Bench Press", muscle_group: "Chest" },
    { name: "Deadlift", muscle_group: "Back" },
    { name: "Overhead Press", muscle_group: "Shoulders" },
    { name: "Pull-Up", muscle_group: "Back" },
  ]);
}
