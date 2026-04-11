import { db } from "@infrastructure/database/db";
import { afterAll, beforeEach } from "vitest";

beforeEach(async () => {
  await db.raw(
    "TRUNCATE TABLE password_reset_tokens, email_verifications, refresh_tokens, workout_sets, workouts, users, exercises RESTART IDENTITY CASCADE",
  );
});

afterAll(async () => {
  await db.destroy();
});
