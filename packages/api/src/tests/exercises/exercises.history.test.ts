import { db } from "@infrastructure/database/db";
import { createApp } from "@presentation/app";
import supertest from "supertest";
import { authed, registerAndLogin } from "tests/helpers/auth";
import { describe, expect, it } from "vitest";

let emailCounter = 0;
function uniqueEmail() {
  return `history-${++emailCounter}@example.com`;
}

async function createExercise(name = "Bench Press") {
  const [ex] = await db("exercises")
    .insert({ name, exercise_category: "strength", muscle_group: "Chest" })
    .returning("*");
  return ex.id as string;
}

async function getUserId(email: string) {
  const user = await db("users").where({ email }).first("id");
  return user!.id as string;
}

async function insertCompletedWorkout(
  userId: string,
  name: string,
  completedAt: Date,
) {
  const scheduledAt = new Date(completedAt.getTime() - 3600000);
  const [w] = await db("workouts")
    .insert({
      user_id: userId,
      name,
      scheduled_at: scheduledAt,
      completed_at: completedAt,
      difficulty: "intermediate",
      type: "strength",
    })
    .returning("*");
  return w.id as string;
}

async function insertStrengthSet(
  workoutId: string,
  exerciseId: string,
  setNumber: number,
  reps: number,
  weightKg: number,
) {
  await db("workout_sets").insert({
    workout_id: workoutId,
    exercise_id: exerciseId,
    set_number: setNumber,
    set_type: "strength",
    details: JSON.stringify({ reps, weightKg, restSeconds: null }),
  });
}

const app = createApp();

describe("GET /api/exercises/:exerciseId/history", () => {
  it("returns 200 with exercise and grouped entries for completed workouts", async () => {
    const email = uniqueEmail();
    const token = await registerAndLogin(email);
    const userId = await getUserId(email);
    const exId = await createExercise();

    const workoutId = await insertCompletedWorkout(
      userId,
      "Morning Lift",
      new Date("2024-03-01T10:00:00Z"),
    );
    await insertStrengthSet(workoutId, exId, 1, 10, 100);
    await insertStrengthSet(workoutId, exId, 2, 8, 105);

    const res = await authed(token).get(`/api/exercises/${exId}/history`);

    expect(res.status).toBe(200);
    expect(res.body.exercise.id).toBe(exId);
    expect(res.body.exercise.name).toBe("Bench Press");
    expect(res.body.entries).toHaveLength(1);
    expect(res.body.entries[0].workoutId).toBe(workoutId);
    expect(res.body.entries[0].workoutName).toBe("Morning Lift");
    expect(res.body.entries[0].completedAt).toBeDefined();
    expect(res.body.entries[0].sets).toHaveLength(2);
    expect(res.body.entries[0].sets[0].setType).toBe("strength");
    expect(res.body.entries[0].sets[0].weightKg).toBe(100);
    expect(res.body.entries[0].sets[1].weightKg).toBe(105);
  });

  it("returns entries ordered chronologically ascending by completedAt", async () => {
    const email = uniqueEmail();
    const token = await registerAndLogin(email);
    const userId = await getUserId(email);
    const exId = await createExercise("Squat");

    const id1 = await insertCompletedWorkout(
      userId,
      "Workout A",
      new Date("2024-01-01T10:00:00Z"),
    );
    const id2 = await insertCompletedWorkout(
      userId,
      "Workout B",
      new Date("2024-02-01T10:00:00Z"),
    );
    const id3 = await insertCompletedWorkout(
      userId,
      "Workout C",
      new Date("2024-03-01T10:00:00Z"),
    );
    await insertStrengthSet(id1, exId, 1, 5, 80);
    await insertStrengthSet(id2, exId, 1, 5, 90);
    await insertStrengthSet(id3, exId, 1, 5, 100);

    const res = await authed(token).get(`/api/exercises/${exId}/history`);

    expect(res.status).toBe(200);
    expect(res.body.entries).toHaveLength(3);
    expect(res.body.entries[0].workoutName).toBe("Workout A");
    expect(res.body.entries[1].workoutName).toBe("Workout B");
    expect(res.body.entries[2].workoutName).toBe("Workout C");
  });

  it("orders sets within each entry by set_number ascending", async () => {
    const email = uniqueEmail();
    const token = await registerAndLogin(email);
    const userId = await getUserId(email);
    const exId = await createExercise("Deadlift");

    const workoutId = await insertCompletedWorkout(
      userId,
      "Heavy Day",
      new Date("2024-03-01T10:00:00Z"),
    );
    await insertStrengthSet(workoutId, exId, 3, 5, 90);
    await insertStrengthSet(workoutId, exId, 1, 10, 100);
    await insertStrengthSet(workoutId, exId, 2, 8, 105);

    const res = await authed(token).get(`/api/exercises/${exId}/history`);

    expect(res.status).toBe(200);
    const sets = res.body.entries[0].sets;
    expect(sets[0].setNumber).toBe(1);
    expect(sets[1].setNumber).toBe(2);
    expect(sets[2].setNumber).toBe(3);
  });

  it("does not include entries from another user's workouts", async () => {
    const emailA = uniqueEmail();
    const emailB = uniqueEmail();
    const tokenA = await registerAndLogin(emailA);
    await registerAndLogin(emailB);
    const userIdB = await getUserId(emailB);

    const exId = await createExercise("Row");
    const workoutId = await insertCompletedWorkout(
      userIdB,
      "User B Workout",
      new Date("2024-03-01T10:00:00Z"),
    );
    await insertStrengthSet(workoutId, exId, 1, 10, 100);

    const res = await authed(tokenA).get(`/api/exercises/${exId}/history`);

    expect(res.status).toBe(200);
    expect(res.body.entries).toHaveLength(0);
  });

  it("does not include sets from workouts where completedAt is null", async () => {
    const email = uniqueEmail();
    const token = await registerAndLogin(email);
    const userId = await getUserId(email);
    const exId = await createExercise("Lunge");

    const [w] = await db("workouts")
      .insert({
        user_id: userId,
        name: "Incomplete",
        scheduled_at: new Date("2024-03-01T08:00:00Z"),
        completed_at: null,
        difficulty: "beginner",
        type: "strength",
      })
      .returning("*");

    await insertStrengthSet(w.id, exId, 1, 10, 60);

    const res = await authed(token).get(`/api/exercises/${exId}/history`);

    expect(res.status).toBe(200);
    expect(res.body.entries).toHaveLength(0);
  });

  it("returns empty entries when exercise exists but user has no completed workouts with it", async () => {
    const token = await registerAndLogin(uniqueEmail());
    const exId = await createExercise("Curl");

    const res = await authed(token).get(`/api/exercises/${exId}/history`);

    expect(res.status).toBe(200);
    expect(res.body.exercise.id).toBe(exId);
    expect(res.body.entries).toHaveLength(0);
  });

  it("returns 404 when exercise does not exist", async () => {
    const token = await registerAndLogin(uniqueEmail());

    const res = await authed(token).get(
      "/api/exercises/00000000-0000-0000-0000-000000000000/history",
    );

    expect(res.status).toBe(404);
  });

  it("respects the ?limit= query param, capping sessions returned", async () => {
    const email = uniqueEmail();
    const token = await registerAndLogin(email);
    const userId = await getUserId(email);
    const exId = await createExercise("Press");

    for (let i = 1; i <= 4; i++) {
      const wId = await insertCompletedWorkout(
        userId,
        `Workout ${i}`,
        new Date(`2024-0${i}-01T10:00:00Z`),
      );
      await insertStrengthSet(wId, exId, 1, 5, 80 + i * 5);
    }

    const res = await authed(token).get(
      `/api/exercises/${exId}/history?limit=2`,
    );

    expect(res.status).toBe(200);
    expect(res.body.entries).toHaveLength(2);
  });

  it("returns 401 without auth", async () => {
    const exId = await createExercise("OHP");

    const res = await supertest(app).get(`/api/exercises/${exId}/history`);

    expect(res.status).toBe(401);
  });
});
