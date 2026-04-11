import { db } from "@infrastructure/database/db";
import { authed, registerAndLogin } from "tests/helpers/auth";
import { beforeEach, describe, expect, it } from "vitest";

const futureDate = new Date(Date.now() + 86400000).toISOString();

let token: string;
let workoutId: string;
let exerciseId: string;
let emailCounter = 0;

beforeEach(async () => {
  emailCounter++;
  token = await registerAndLogin(`user${emailCounter}@example.com`);

  const workoutRes = await authed(token)
    .post("/api/workouts")
    .send({ name: "Test Workout", scheduledAt: futureDate });
  workoutId = workoutRes.body.id;

  // Seed one exercise directly — exercises are global
  const [exercise] = await db("exercises")
    .insert({ name: "Bench Press", muscle_group: "Chest" })
    .returning("*");
  exerciseId = exercise.id;
});

describe("POST /api/workouts/:workoutId/sets", () => {
  it("creates a set and returns 201", async () => {
    const response = await authed(token)
      .post(`/api/workouts/${workoutId}/sets`)
      .send({ exerciseId, setNumber: 1, reps: 10, weightKg: 80 });

    expect(response.status).toBe(201);
    expect(response.body.exerciseId).toBe(exerciseId);
    expect(response.body.workoutId).toBe(workoutId);
    expect(response.body.reps).toBe(10);
    expect(response.body.weightKg).toBe(80);
  });

  it("returns 400 when required fields are missing", async () => {
    const response = await authed(token)
      .post(`/api/workouts/${workoutId}/sets`)
      .send({ exerciseId, setNumber: 1 }); // missing reps and weightKg

    expect(response.status).toBe(400);
  });

  it("returns 404 when workout does not belong to the user", async () => {
    const otherToken = await registerAndLogin("other@example.com");
    const response = await authed(otherToken)
      .post(`/api/workouts/${workoutId}/sets`)
      .send({ exerciseId, setNumber: 1, reps: 10, weightKg: 80 });

    expect(response.status).toBe(404);
  });

  it("returns 409 when set number already exists in the workout", async () => {
    await authed(token)
      .post(`/api/workouts/${workoutId}/sets`)
      .send({ exerciseId, setNumber: 1, reps: 10, weightKg: 80 });

    const response = await authed(token)
      .post(`/api/workouts/${workoutId}/sets`)
      .send({ exerciseId, setNumber: 1, reps: 8, weightKg: 85 });

    expect(response.status).toBe(409);
  });

  it("returns 404 when exercise does not exist", async () => {
    const response = await authed(token)
      .post(`/api/workouts/${workoutId}/sets`)
      .send({
        exerciseId: "00000000-0000-0000-0000-000000000000",
        setNumber: 1,
        reps: 10,
        weightKg: 80,
      });

    expect(response.status).toBe(404);
  });
});

describe("PATCH /api/workouts/:workoutId/sets/:setId", () => {
  it("updates a set and returns the updated set", async () => {
    const created = await authed(token)
      .post(`/api/workouts/${workoutId}/sets`)
      .send({ exerciseId, setNumber: 1, reps: 10, weightKg: 80 });

    const response = await authed(token)
      .patch(`/api/workouts/${workoutId}/sets/${created.body.id}`)
      .send({ reps: 12, weightKg: 85 });

    expect(response.status).toBe(200);
    expect(response.body.reps).toBe(12);
    expect(response.body.weightKg).toBe(85);
  });

  it("returns 404 when set does not belong to this workout", async () => {
    const otherWorkoutRes = await authed(token)
      .post("/api/workouts")
      .send({ name: "Other Workout", scheduledAt: futureDate });

    const created = await authed(token)
      .post(`/api/workouts/${workoutId}/sets`)
      .send({ exerciseId, setNumber: 1, reps: 10, weightKg: 80 });

    const response = await authed(token)
      .patch(`/api/workouts/${otherWorkoutRes.body.id}/sets/${created.body.id}`)
      .send({ reps: 12 });

    expect(response.status).toBe(404);
  });
});

describe("DELETE /api/workouts/:workoutId/sets/:setId", () => {
  it("deletes a set and returns 204", async () => {
    const created = await authed(token)
      .post(`/api/workouts/${workoutId}/sets`)
      .send({ exerciseId, setNumber: 1, reps: 10, weightKg: 80 });

    const response = await authed(token).delete(
      `/api/workouts/${workoutId}/sets/${created.body.id}`,
    );

    expect(response.status).toBe(204);
  });

  it("returns 404 when set does not belong to this workout", async () => {
    const otherWorkoutRes = await authed(token)
      .post("/api/workouts")
      .send({ name: "Other Workout", scheduledAt: futureDate });

    const created = await authed(token)
      .post(`/api/workouts/${workoutId}/sets`)
      .send({ exerciseId, setNumber: 1, reps: 10, weightKg: 80 });

    const response = await authed(token).delete(
      `/api/workouts/${otherWorkoutRes.body.id}/sets/${created.body.id}`,
    );

    expect(response.status).toBe(404);
  });
});

describe("GET /api/workouts/:id (sets embedded)", () => {
  it("returns the workout with sets and exercise details embedded", async () => {
    await authed(token)
      .post(`/api/workouts/${workoutId}/sets`)
      .send({ exerciseId, setNumber: 1, reps: 10, weightKg: 80 });
    await authed(token)
      .post(`/api/workouts/${workoutId}/sets`)
      .send({ exerciseId, setNumber: 2, reps: 8, weightKg: 85 });

    const response = await authed(token).get(`/api/workouts/${workoutId}`);

    expect(response.status).toBe(200);
    expect(response.body.sets).toHaveLength(2);
    expect(response.body.sets[0].exercise.name).toBe("Bench Press");
    expect(response.body.sets[0].exercise.muscleGroup).toBe("Chest");
    expect(response.body.sets[0].reps).toBe(10);
  });

  it("returns empty sets array when workout has no sets", async () => {
    const response = await authed(token).get(`/api/workouts/${workoutId}`);

    expect(response.status).toBe(200);
    expect(response.body.sets).toEqual([]);
  });
});
