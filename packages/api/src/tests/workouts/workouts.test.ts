import { db } from "@infrastructure/database/db";
import { authed, registerAndLogin } from "tests/helpers/auth";
import { describe, expect, it } from "vitest";

let emailCounter = 0;
function uniqueEmail() {
  return `user-${++emailCounter}@example.com`;
}

async function createExercise(name = "Test Exercise", category = "strength") {
  const [ex] = await db("exercises")
    .insert({ name, exercise_category: category })
    .returning("*");
  return ex.id as string;
}

const futureDate = new Date(Date.now() + 86400000).toISOString();

function baseWorkout(exerciseId: string) {
  return {
    name: "Morning Session",
    scheduledAt: futureDate,
    durationMinutes: 15,
    difficulty: "intermediate",
    type: "strength",
    exercises: [exerciseId],
  };
}

describe("GET /api/workouts", () => {
  it("returns only the authenticated user's workouts", async () => {
    const exId = await createExercise();
    const tokenA = await registerAndLogin(uniqueEmail());
    const tokenB = await registerAndLogin(uniqueEmail());

    await authed(tokenA).post("/api/workouts").send({ ...baseWorkout(exId), name: "User A Workout" });
    await authed(tokenB).post("/api/workouts").send({ ...baseWorkout(exId), name: "User B Workout" });

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
    const exId = await createExercise();
    const token = await registerAndLogin(uniqueEmail());

    for (let i = 1; i <= 5; i++) {
      await authed(token).post("/api/workouts").send({
        name: `Workout ${i}`,
        scheduledAt: futureDate,
        durationMinutes: 30,
        difficulty: "beginner",
        type: "strength",
        exercises: [exId],
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
    const exId = await createExercise();
    const token = await registerAndLogin(uniqueEmail());

    const response = await authed(token).post("/api/workouts").send(baseWorkout(exId));

    expect(response.status).toBe(201);
    expect(response.body.name).toBe("Morning Session");
    expect(response.body.id).toBeDefined();
    expect(response.body.completedAt).toBeNull();
    expect(response.body.exercises).toHaveLength(1);
    expect(response.body.exercises[0].exerciseId).toBe(exId);
    expect(response.body.exercises[0].orderIndex).toBe(1);
  });

  it("preserves exercise order from the request array", async () => {
    const exId1 = await createExercise("Exercise 1");
    const exId2 = await createExercise("Exercise 2");
    const token = await registerAndLogin(uniqueEmail());

    const response = await authed(token).post("/api/workouts").send({
      ...baseWorkout(exId1),
      exercises: [exId2, exId1],
    });

    expect(response.status).toBe(201);
    expect(response.body.exercises[0].exerciseId).toBe(exId2);
    expect(response.body.exercises[0].orderIndex).toBe(1);
    expect(response.body.exercises[1].exerciseId).toBe(exId1);
    expect(response.body.exercises[1].orderIndex).toBe(2);
  });

  it("returns 400 when exercises is missing", async () => {
    const token = await registerAndLogin(uniqueEmail());
    const exId = await createExercise();
    const { exercises: _exercises, ...withoutExercises } = baseWorkout(exId);

    const response = await authed(token).post("/api/workouts").send(withoutExercises);

    expect(response.status).toBe(400);
  });

  it("returns 400 when exercises is empty", async () => {
    const exId = await createExercise();
    const token = await registerAndLogin(uniqueEmail());

    const response = await authed(token)
      .post("/api/workouts")
      .send({ ...baseWorkout(exId), exercises: [] });

    expect(response.status).toBe(400);
  });

  it("returns 404 when an exercise ID does not exist", async () => {
    const exId = await createExercise();
    const token = await registerAndLogin(uniqueEmail());

    const response = await authed(token).post("/api/workouts").send({
      ...baseWorkout(exId),
      exercises: ["00000000-0000-0000-0000-000000000000"],
    });

    expect(response.status).toBe(404);
  });

  it("returns 400 when name is missing", async () => {
    const exId = await createExercise();
    const token = await registerAndLogin(uniqueEmail());
    const { name: _name, ...withoutName } = baseWorkout(exId);

    const response = await authed(token).post("/api/workouts").send(withoutName);

    expect(response.status).toBe(400);
  });

  it("returns 400 when scheduledAt is missing", async () => {
    const exId = await createExercise();
    const token = await registerAndLogin(uniqueEmail());
    const { scheduledAt: _sat, ...withoutScheduledAt } = baseWorkout(exId);

    const response = await authed(token).post("/api/workouts").send(withoutScheduledAt);

    expect(response.status).toBe(400);
  });
});

describe("GET /api/workouts/:id", () => {
  it("returns the workout with exercises for its owner", async () => {
    const exId = await createExercise();
    const token = await registerAndLogin(uniqueEmail());
    const created = await authed(token).post("/api/workouts").send(baseWorkout(exId));

    const response = await authed(token).get(`/api/workouts/${created.body.id}`);

    expect(response.status).toBe(200);
    expect(response.body.name).toBe("Morning Session");
    expect(response.body.exercises).toHaveLength(1);
    expect(response.body.exercises[0].exerciseId).toBe(exId);
    expect(response.body.exercises[0].orderIndex).toBe(1);
  });

  it("returns 404 when workout belongs to another user", async () => {
    const exId = await createExercise();
    const tokenA = await registerAndLogin(uniqueEmail());
    const tokenB = await registerAndLogin(uniqueEmail());

    const created = await authed(tokenA)
      .post("/api/workouts")
      .send({ ...baseWorkout(exId), name: "Private Workout" });

    const response = await authed(tokenB).get(`/api/workouts/${created.body.id}`);

    expect(response.status).toBe(404);
  });

  it("returns 404 for a non-existent workout", async () => {
    const token = await registerAndLogin(uniqueEmail());
    const response = await authed(token).get(
      "/api/workouts/00000000-0000-0000-0000-000000000000",
    );
    expect(response.status).toBe(404);
  });
});

describe("PATCH /api/workouts/:id", () => {
  it("updates the workout name for its owner", async () => {
    const exId = await createExercise();
    const token = await registerAndLogin(uniqueEmail());
    const created = await authed(token)
      .post("/api/workouts")
      .send({ ...baseWorkout(exId), name: "Old Name" });

    const response = await authed(token)
      .patch(`/api/workouts/${created.body.id}`)
      .send({ name: "New Name" });

    expect(response.status).toBe(200);
    expect(response.body.name).toBe("New Name");
  });

  it("can reorder exercises when no sets are logged", async () => {
    const exId1 = await createExercise("Exercise 1");
    const exId2 = await createExercise("Exercise 2");
    const token = await registerAndLogin(uniqueEmail());

    const created = await authed(token).post("/api/workouts").send({
      ...baseWorkout(exId1),
      exercises: [exId1, exId2],
    });

    const response = await authed(token)
      .patch(`/api/workouts/${created.body.id}`)
      .send({ exercises: [exId2, exId1] });

    expect(response.status).toBe(200);
    expect(response.body.exercises[0].exerciseId).toBe(exId2);
    expect(response.body.exercises[0].orderIndex).toBe(1);
    expect(response.body.exercises[1].exerciseId).toBe(exId1);
    expect(response.body.exercises[1].orderIndex).toBe(2);
  });

  it("returns 409 when workout has logged sets", async () => {
    const exId = await createExercise();
    const token = await registerAndLogin(uniqueEmail());
    const created = await authed(token).post("/api/workouts").send(baseWorkout(exId));

    await db("workout_sets").insert({
      workout_id: created.body.id,
      exercise_id: exId,
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
    const exId = await createExercise();
    const tokenA = await registerAndLogin(uniqueEmail());
    const tokenB = await registerAndLogin(uniqueEmail());

    const created = await authed(tokenA).post("/api/workouts").send(baseWorkout(exId));

    const response = await authed(tokenB)
      .patch(`/api/workouts/${created.body.id}`)
      .send({ name: "Hijacked" });

    expect(response.status).toBe(404);
  });

  it("accepts completedAt when it is after scheduledAt", async () => {
    const exId = await createExercise();
    const token = await registerAndLogin(uniqueEmail());
    const scheduledAt = new Date(Date.now() - 7200000).toISOString();
    const created = await authed(token)
      .post("/api/workouts")
      .send({ ...baseWorkout(exId), scheduledAt });

    const completedAt = new Date(Date.now() - 3600000).toISOString();
    const response = await authed(token)
      .patch(`/api/workouts/${created.body.id}`)
      .send({ completedAt });

    expect(response.status).toBe(200);
    expect(response.body.completedAt).not.toBeNull();
  });

  it("returns 400 when completedAt is before scheduledAt", async () => {
    const exId = await createExercise();
    const token = await registerAndLogin(uniqueEmail());
    const scheduledAt = new Date(Date.now() - 3600000).toISOString();
    const created = await authed(token)
      .post("/api/workouts")
      .send({ ...baseWorkout(exId), scheduledAt });

    const completedAt = new Date(Date.now() - 7200000).toISOString();
    const response = await authed(token)
      .patch(`/api/workouts/${created.body.id}`)
      .send({ completedAt });

    expect(response.status).toBe(400);
  });
});

describe("DELETE /api/workouts/:id", () => {
  it("deletes the workout for its owner and returns 204", async () => {
    const exId = await createExercise();
    const token = await registerAndLogin(uniqueEmail());
    const created = await authed(token).post("/api/workouts").send(baseWorkout(exId));

    const response = await authed(token).delete(`/api/workouts/${created.body.id}`);

    expect(response.status).toBe(204);
  });

  it("returns 404 when workout belongs to another user", async () => {
    const exId = await createExercise();
    const tokenA = await registerAndLogin(uniqueEmail());
    const tokenB = await registerAndLogin(uniqueEmail());

    const created = await authed(tokenA).post("/api/workouts").send(baseWorkout(exId));

    const response = await authed(tokenB).delete(`/api/workouts/${created.body.id}`);

    expect(response.status).toBe(404);
  });
});
