import { db } from "@infrastructure/database/db";
import { afterAll, beforeEach } from "vitest";

beforeEach(async () => {
  await db.raw(
    "TRUNCATE TABLE password_reset_tokens, email_verifications, refresh_tokens, workout_sets, workout_exercises, workouts, workout_plans, template_sets, template_exercises, workout_templates, users, exercises RESTART IDENTITY CASCADE",
  );
});

afterAll(async () => {
  await db.destroy();
});
