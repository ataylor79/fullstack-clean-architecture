import { db } from "@infrastructure/database/db";
import { authed, registerAndLogin } from "tests/helpers/auth";
import { beforeEach, describe, expect, it } from "vitest";

const futureDate = new Date(Date.now() + 86400000).toISOString();

let defaultExerciseId: string;
let exerciseCounter = 0;

beforeEach(async () => {
  exerciseCounter++;
  const countBefore = (await db("exercises").count("id as cnt").first()) as {
    cnt: string;
  };
  console.log(
    `[beforeEach ${exerciseCounter}] exercises before insert: ${countBefore.cnt}`,
  );
  const [ex] = await db("exercises")
    .insert({
      name: `Test Exercise ${exerciseCounter}`,
      exercise_category: "strength",
    })
    .returning("*");
  defaultExerciseId = ex.id;
  console.log(
    `[beforeEach ${exerciseCounter}] inserted exercise ${defaultExerciseId}`,
  );
});

const baseWorkout = () => ({
  name: "Morning Session",
  scheduledAt: futureDate,
  durationMinutes: 15,
  difficulty: "intermediate",
  type: "strength",
  exercises: [defaultExerciseId],
});

describe("GET /api/workouts", () => {
  it("returns only the authenticated user's workouts", async () => {
    const tokenA = await registerAndLogin("a@example.com");
    const tokenB = await registerAndLogin("b@example.com");

    await authed(tokenA)
      .post("/api/workouts")
      .send({ ...baseWorkout(), name: "User A Workout" });
    await authed(tokenB)
      .post("/api/workouts")
      .send({ ...baseWorkout(), name: "User B Workout" });

    const response = await authed(tokenA).get("/api/workouts");

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].name).toBe("User A Workout");
    expect(response.body.pagination).toMatchObject({
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
    });
  });

  it("paginates results and returns correct metadata", async () => {
    const token = await registerAndLogin("user@example.com");

    for (let i = 1; i <= 5; i++) {
      await authed(token)
        .post("/api/workouts")
        .send({
          name: `Workout ${i}`,
          scheduledAt: futureDate,
          durationMinutes: 30,
          difficulty: "beginner",
          type: "strength",
          exercises: [defaultExerciseId],
        });
    }

    const page1 = await authed(token).get("/api/workouts?page=1&limit=2");
    expect(page1.status).toBe(200);
    expect(page1.body.data).toHaveLength(2);
    expect(page1.body.pagination).toMatchObject({
      page: 1,
      limit: 2,
      total: 5,
      totalPages: 3,
    });

    const page3 = await authed(token).get("/api/workouts?page=3&limit=2");
    expect(page3.body.data).toHaveLength(1);
    expect(page3.body.pagination).toMatchObject({
      page: 3,
      limit: 2,
      total: 5,
      totalPages: 3,
    });
  });
});

describe("POST /api/workouts", () => {
  it("creates a workout with exercises and returns 201", async () => {
    const token = await registerAndLogin("user@example.com");

    const response = await authed(token)
      .post("/api/workouts")
      .send(baseWorkout());

    expect(response.status).toBe(201);
    expect(response.body.name).toBe("Morning Session");
    expect(response.body.id).toBeDefined();
    expect(response.body.completedAt).toBeNull();
    expect(response.body.exercises).toHaveLength(1);
    expect(response.body.exercises[0].exerciseId).toBe(defaultExerciseId);
    expect(response.body.exercises[0].orderIndex).toBe(1);
  });

  it("preserves exercise order from the request array", async () => {
    const token = await registerAndLogin("user@example.com");
    const [ex2] = await db("exercises")
      .insert({ name: "Squat", exercise_category: "strength" })
      .returning("*");

    const response = await authed(token)
      .post("/api/workouts")
      .send({
        ...baseWorkout(),
        exercises: [ex2.id, defaultExerciseId],
      });

    expect(response.status).toBe(201);
    expect(response.body.exercises[0].exerciseId).toBe(ex2.id);
    expect(response.body.exercises[0].orderIndex).toBe(1);
    expect(response.body.exercises[1].exerciseId).toBe(defaultExerciseId);
    expect(response.body.exercises[1].orderIndex).toBe(2);
  });

  it("returns 400 when exercises is missing", async () => {
    const token = await registerAndLogin("user@example.com");
    const { exercises: _exercises, ...withoutExercises } = baseWorkout();

    const response = await authed(token)
      .post("/api/workouts")
      .send(withoutExercises);

    expect(response.status).toBe(400);
  });

  it("returns 400 when exercises is empty", async () => {
    const token = await registerAndLogin("user@example.com");

    const response = await authed(token)
      .post("/api/workouts")
      .send({ ...baseWorkout(), exercises: [] });

    expect(response.status).toBe(400);
  });

  it("returns 404 when an exercise ID does not exist", async () => {
    const token = await registerAndLogin("user@example.com");

    const response = await authed(token)
      .post("/api/workouts")
      .send({
        ...baseWorkout(),
        exercises: ["00000000-0000-0000-0000-000000000000"],
      });

    expect(response.status).toBe(404);
  });

  it("returns 400 when name is missing", async () => {
    const token = await registerAndLogin("user@example.com");
    const { name: _name, ...withoutName } = baseWorkout();

    const response = await authed(token)
      .post("/api/workouts")
      .send(withoutName);

    expect(response.status).toBe(400);
  });

  it("returns 400 when scheduledAt is missing", async () => {
    const token = await registerAndLogin("user@example.com");
    const { scheduledAt: _sat, ...withoutScheduledAt } = baseWorkout();

    const response = await authed(token)
      .post("/api/workouts")
      .send(withoutScheduledAt);

    expect(response.status).toBe(400);
  });
});

describe("GET /api/workouts/:id", () => {
  it("returns the workout with exercises for its owner", async () => {
    const token = await registerAndLogin("user@example.com");
    const created = await authed(token)
      .post("/api/workouts")
      .send(baseWorkout());

    const response = await authed(token).get(
      `/api/workouts/${created.body.id}`,
    );

    expect(response.status).toBe(200);
    expect(response.body.name).toBe("Morning Session");
    expect(response.body.exercises).toHaveLength(1);
    expect(response.body.exercises[0].exerciseId).toBe(defaultExerciseId);
    expect(response.body.exercises[0].orderIndex).toBe(1);
  });

  it("returns 404 when workout belongs to another user", async () => {
    const tokenA = await registerAndLogin("a@example.com");
    const tokenB = await registerAndLogin("b@example.com");

    const created = await authed(tokenA)
      .post("/api/workouts")
      .send({ ...baseWorkout(), name: "Private Workout" });

    const response = await authed(tokenB).get(
      `/api/workouts/${created.body.id}`,
    );

    expect(response.status).toBe(404);
  });

  it("returns 404 for a non-existent workout", async () => {
    const token = await registerAndLogin("user@example.com");
    const response = await authed(token).get(
      "/api/workouts/00000000-0000-0000-0000-000000000000",
    );
    expect(response.status).toBe(404);
  });
});

describe("PATCH /api/workouts/:id", () => {
  it("updates the workout name for its owner", async () => {
    const token = await registerAndLogin("user@example.com");
    const created = await authed(token)
      .post("/api/workouts")
      .send({ ...baseWorkout(), name: "Old Name" });

    const response = await authed(token)
      .patch(`/api/workouts/${created.body.id}`)
      .send({ name: "New Name" });

    expect(response.status).toBe(200);
    expect(response.body.name).toBe("New Name");
  });

  it("can reorder exercises when no sets are logged", async () => {
    const token = await registerAndLogin("user@example.com");
    const [ex2] = await db("exercises")
      .insert({ name: "Squat", exercise_category: "strength" })
      .returning("*");

    const created = await authed(token)
      .post("/api/workouts")
      .send({
        ...baseWorkout(),
        exercises: [defaultExerciseId, ex2.id],
      });

    const response = await authed(token)
      .patch(`/api/workouts/${created.body.id}`)
      .send({ exercises: [ex2.id, defaultExerciseId] });

    expect(response.status).toBe(200);
    expect(response.body.exercises[0].exerciseId).toBe(ex2.id);
    expect(response.body.exercises[0].orderIndex).toBe(1);
    expect(response.body.exercises[1].exerciseId).toBe(defaultExerciseId);
    expect(response.body.exercises[1].orderIndex).toBe(2);
  });

  it("returns 409 when workout has logged sets", async () => {
    const token = await registerAndLogin("user@example.com");
    const created = await authed(token)
      .post("/api/workouts")
      .send(baseWorkout());

    await db("workout_sets").insert({
      workout_id: created.body.id,
      exercise_id: defaultExerciseId,
      set_number: 1,
      set_type: "strength",
      details: JSON.stringify({ reps: 10, weightKg: 80, restSeconds: null }),
    });

    const response = await authed(token)
      .patch(`/api/workouts/${created.body.id}`)
      .send({ difficulty: "advanced" });

    expect(response.status).toBe(409);
  });

  it("returns 404 when workout belongs to another user", async () => {
    const tokenA = await registerAndLogin("a@example.com");
    const tokenB = await registerAndLogin("b@example.com");

    const created = await authed(tokenA)
      .post("/api/workouts")
      .send(baseWorkout());

    const response = await authed(tokenB)
      .patch(`/api/workouts/${created.body.id}`)
      .send({ name: "Hijacked" });

    expect(response.status).toBe(404);
  });

  it("accepts completedAt when it is after scheduledAt", async () => {
    const token = await registerAndLogin("user@example.com");
    const scheduledAt = new Date(Date.now() - 7200000).toISOString();
    const created = await authed(token)
      .post("/api/workouts")
      .send({ ...baseWorkout(), scheduledAt });

    const completedAt = new Date(Date.now() - 3600000).toISOString();
    const response = await authed(token)
      .patch(`/api/workouts/${created.body.id}`)
      .send({ completedAt });

    expect(response.status).toBe(200);
    expect(response.body.completedAt).not.toBeNull();
  });

  it("returns 400 when completedAt is before scheduledAt", async () => {
    const token = await registerAndLogin("user@example.com");
    const scheduledAt = new Date(Date.now() - 3600000).toISOString();
    const created = await authed(token)
      .post("/api/workouts")
      .send({ ...baseWorkout(), scheduledAt });

    const completedAt = new Date(Date.now() - 7200000).toISOString();
    const response = await authed(token)
      .patch(`/api/workouts/${created.body.id}`)
      .send({ completedAt });

    expect(response.status).toBe(400);
  });
});

describe("DELETE /api/workouts/:id", () => {
  it("deletes the workout for its owner and returns 204", async () => {
    const token = await registerAndLogin("user@example.com");
    const created = await authed(token)
      .post("/api/workouts")
      .send(baseWorkout());

    const response = await authed(token).delete(
      `/api/workouts/${created.body.id}`,
    );

    expect(response.status).toBe(204);
  });

  it("returns 404 when workout belongs to another user", async () => {
    const tokenA = await registerAndLogin("a@example.com");
    const tokenB = await registerAndLogin("b@example.com");

    const created = await authed(tokenA)
      .post("/api/workouts")
      .send(baseWorkout());

    const response = await authed(tokenB).delete(
      `/api/workouts/${created.body.id}`,
    );

    expect(response.status).toBe(404);
  });
});
