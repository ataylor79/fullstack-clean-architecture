import { beforeEach, afterAll } from "vitest";
import { db } from "../infrastructure/database/db";

beforeEach(async () => {
  await db.raw(
    "TRUNCATE TABLE email_verifications, refresh_tokens, workout_sets, workouts, users, exercises RESTART IDENTITY CASCADE"
  );
});

afterAll(async () => {
  await db.destroy();
});
