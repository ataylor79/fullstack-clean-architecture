import { db } from "@infrastructure/database/db";
import { authed, registerAndLogin } from "tests/helpers/auth";
import { beforeEach, describe, expect, it } from "vitest";

const futureDate = new Date(Date.now() + 86400000).toISOString();

let token: string;
let workoutId: string;
let strengthExerciseId: string;
let secondStrengthExerciseId: string;
let emailCounter = 0;

beforeEach(async () => {
  emailCounter++;
  token = await registerAndLogin(`user${emailCounter}@example.com`);

  // Seed exercises first so we can include them in the workout
  const [bench, squat] = await db("exercises")
    .insert([
      {
        name: "Bench Press",
        muscle_group: "Chest",
        exercise_category: "strength",
      },
      { name: "Squat", muscle_group: "Legs", exercise_category: "strength" },
    ])
    .returning("*");
  strengthExerciseId = bench.id;
  secondStrengthExerciseId = squat.id;

  const workoutRes = await authed(token)
    .post("/api/workouts")
    .send({
      name: "Test Workout",
      scheduledAt: futureDate,
      durationMinutes: 45,
      difficulty: "intermediate",
      type: "strength",
      exercises: [strengthExerciseId, secondStrengthExerciseId],
    });
  workoutId = workoutRes.body.id;
});

describe("POST /api/workouts/:workoutId/sets (strength)", () => {
  it("creates a strength set and returns 201", async () => {
    const response = await authed(token)
      .post(`/api/workouts/${workoutId}/sets`)
      .send({
        setType: "strength",
        exerciseId: strengthExerciseId,
        setNumber: 1,
        reps: 10,
        weightKg: 80,
      });

    expect(response.status).toBe(201);
    expect(response.body.setType).toBe("strength");
    expect(response.body.exerciseId).toBe(strengthExerciseId);
    expect(response.body.workoutId).toBe(workoutId);
    expect(response.body.reps).toBe(10);
    expect(response.body.weightKg).toBe(80);
  });

  it("creates a strength set with restSeconds", async () => {
    const response = await authed(token)
      .post(`/api/workouts/${workoutId}/sets`)
      .send({
        setType: "strength",
        exerciseId: strengthExerciseId,
        setNumber: 1,
        reps: 10,
        weightKg: 80,
        restSeconds: 90,
      });

    expect(response.status).toBe(201);
    expect(response.body.restSeconds).toBe(90);
  });

  it("returns 400 when required fields are missing", async () => {
    const response = await authed(token)
      .post(`/api/workouts/${workoutId}/sets`)
      .send({
        setType: "strength",
        exerciseId: strengthExerciseId,
        setNumber: 1,
      }); // missing reps and weightKg

    expect(response.status).toBe(400);
  });

  it("returns 400 when fields from another set type are included", async () => {
    const response = await authed(token)
      .post(`/api/workouts/${workoutId}/sets`)
      .send({
        setType: "strength",
        exerciseId: strengthExerciseId,
        setNumber: 1,
        reps: 10,
        weightKg: 80,
        distanceMeters: 5000,
      });

    expect(response.status).toBe(400);
  });

  it("returns 400 when set type does not match workout type", async () => {
    const [cardioExercise] = await db("exercises")
      .insert({ name: "Running", exercise_category: "cardio" })
      .returning("*");

    const response = await authed(token)
      .post(`/api/workouts/${workoutId}/sets`)
      .send({
        setType: "cardio",
        exerciseId: cardioExercise.id,
        setNumber: 1,
        durationSeconds: 300,
        intensityLevel: 7,
      });

    expect(response.status).toBe(400);
  });

  it("returns 400 when exercise category does not match set type", async () => {
    const [cardioExercise] = await db("exercises")
      .insert({ name: "Running", exercise_category: "cardio" })
      .returning("*");

    const response = await authed(token)
      .post(`/api/workouts/${workoutId}/sets`)
      .send({
        setType: "strength",
        exerciseId: cardioExercise.id,
        setNumber: 1,
        reps: 10,
        weightKg: 80,
      });

    expect(response.status).toBe(400);
  });

  it("returns 404 when workout does not belong to the user", async () => {
    const otherToken = await registerAndLogin("other@example.com");
    const response = await authed(otherToken)
      .post(`/api/workouts/${workoutId}/sets`)
      .send({
        setType: "strength",
        exerciseId: strengthExerciseId,
        setNumber: 1,
        reps: 10,
        weightKg: 80,
      });

    expect(response.status).toBe(404);
  });

  it("returns 409 when same exercise and set number already exist in the workout", async () => {
    await authed(token).post(`/api/workouts/${workoutId}/sets`).send({
      setType: "strength",
      exerciseId: strengthExerciseId,
      setNumber: 1,
      reps: 10,
      weightKg: 80,
    });

    const response = await authed(token)
      .post(`/api/workouts/${workoutId}/sets`)
      .send({
        setType: "strength",
        exerciseId: strengthExerciseId,
        setNumber: 1,
        reps: 8,
        weightKg: 85,
      });

    expect(response.status).toBe(409);
  });

  it("allows the same set number for different exercises", async () => {
    await authed(token).post(`/api/workouts/${workoutId}/sets`).send({
      setType: "strength",
      exerciseId: strengthExerciseId,
      setNumber: 1,
      reps: 10,
      weightKg: 80,
    });

    const response = await authed(token)
      .post(`/api/workouts/${workoutId}/sets`)
      .send({
        setType: "strength",
        exerciseId: secondStrengthExerciseId,
        setNumber: 1,
        reps: 5,
        weightKg: 100,
      });

    expect(response.status).toBe(201);
  });

  it("returns 404 when exercise does not exist", async () => {
    const response = await authed(token)
      .post(`/api/workouts/${workoutId}/sets`)
      .send({
        setType: "strength",
        exerciseId: "00000000-0000-0000-0000-000000000000",
        setNumber: 1,
        reps: 10,
        weightKg: 80,
      });

    expect(response.status).toBe(404);
  });

  it("returns 422 when exercise exists but is not listed in the workout", async () => {
    const [other] = await db("exercises")
      .insert({
        name: "Deadlift",
        muscle_group: "Back",
        exercise_category: "strength",
      })
      .returning("*");

    const response = await authed(token)
      .post(`/api/workouts/${workoutId}/sets`)
      .send({
        setType: "strength",
        exerciseId: other.id,
        setNumber: 1,
        reps: 5,
        weightKg: 120,
      });

    expect(response.status).toBe(422);
  });
});

describe("POST /api/workouts/:workoutId/sets (cardio)", () => {
  let cardioWorkoutId: string;
  let cardioExerciseId: string;

  beforeEach(async () => {
    const [exercise] = await db("exercises")
      .insert({ name: "Running", exercise_category: "cardio" })
      .returning("*");
    cardioExerciseId = exercise.id;

    const res = await authed(token)
      .post("/api/workouts")
      .send({
        name: "Cardio Session",
        scheduledAt: futureDate,
        durationMinutes: 30,
        difficulty: "beginner",
        type: "cardio",
        exercises: [cardioExerciseId],
      });
    cardioWorkoutId = res.body.id;
  });

  it("creates a cardio set and returns 201", async () => {
    const response = await authed(token)
      .post(`/api/workouts/${cardioWorkoutId}/sets`)
      .send({
        setType: "cardio",
        setNumber: 1,
        exerciseId: cardioExerciseId,
        durationSeconds: 1800,
        intensityLevel: 7,
        distanceMeters: 5000,
      });

    expect(response.status).toBe(201);
    expect(response.body.setType).toBe("cardio");
    expect(response.body.exerciseId).toBe(cardioExerciseId);
    expect(response.body.durationSeconds).toBe(1800);
    expect(response.body.intensityLevel).toBe(7);
    expect(response.body.distanceMeters).toBe(5000);
  });

  it("creates a cardio set without distanceMeters", async () => {
    const response = await authed(token)
      .post(`/api/workouts/${cardioWorkoutId}/sets`)
      .send({
        setType: "cardio",
        setNumber: 1,
        exerciseId: cardioExerciseId,
        durationSeconds: 2400,
        intensityLevel: 5,
      });

    expect(response.status).toBe(201);
    expect(response.body.distanceMeters).toBeNull();
  });

  it("returns 400 when intensity is out of range", async () => {
    const response = await authed(token)
      .post(`/api/workouts/${cardioWorkoutId}/sets`)
      .send({
        setType: "cardio",
        setNumber: 1,
        exerciseId: cardioExerciseId,
        durationSeconds: 1800,
        intensityLevel: 11,
      });

    expect(response.status).toBe(400);
  });

  it("returns 400 when set type does not match workout type", async () => {
    const response = await authed(token)
      .post(`/api/workouts/${cardioWorkoutId}/sets`)
      .send({
        setType: "strength",
        exerciseId: strengthExerciseId,
        setNumber: 1,
        reps: 10,
        weightKg: 80,
      });

    expect(response.status).toBe(400);
  });

  it("returns 400 when a strength exercise is used for a cardio set", async () => {
    const response = await authed(token)
      .post(`/api/workouts/${cardioWorkoutId}/sets`)
      .send({
        setType: "cardio",
        setNumber: 1,
        exerciseId: strengthExerciseId,
        durationSeconds: 1800,
        intensityLevel: 7,
      });

    expect(response.status).toBe(400);
  });
});

describe("POST /api/workouts/:workoutId/sets (HIIT)", () => {
  let hiitWorkoutId: string;

  beforeEach(async () => {
    const res = await authed(token)
      .post("/api/workouts")
      .send({
        name: "HIIT Session",
        scheduledAt: futureDate,
        durationMinutes: 20,
        difficulty: "advanced",
        type: "hiit",
        exercises: [strengthExerciseId],
      });
    hiitWorkoutId = res.body.id;
  });

  it("creates a HIIT set and returns 201", async () => {
    const response = await authed(token)
      .post(`/api/workouts/${hiitWorkoutId}/sets`)
      .send({
        setType: "hiit",
        setNumber: 1,
        exerciseId: strengthExerciseId,
        durationSeconds: 40,
        restSeconds: 20,
      });

    expect(response.status).toBe(201);
    expect(response.body.setType).toBe("hiit");
    expect(response.body.durationSeconds).toBe(40);
    expect(response.body.restSeconds).toBe(20);
  });

  it("creates a HIIT set without restSeconds (AMRAP-style)", async () => {
    const response = await authed(token)
      .post(`/api/workouts/${hiitWorkoutId}/sets`)
      .send({
        setType: "hiit",
        setNumber: 1,
        exerciseId: strengthExerciseId,
        durationSeconds: 60,
      });

    expect(response.status).toBe(201);
    expect(response.body.restSeconds).toBeNull();
  });

  it("allows a strength set inside a HIIT workout", async () => {
    const response = await authed(token)
      .post(`/api/workouts/${hiitWorkoutId}/sets`)
      .send({
        setType: "strength",
        setNumber: 1,
        exerciseId: strengthExerciseId,
        reps: 10,
        weightKg: 60,
      });

    expect(response.status).toBe(201);
    expect(response.body.setType).toBe("strength");
  });

  it("returns 400 when a cardio set is added to a HIIT workout", async () => {
    const [cardioExercise] = await db("exercises")
      .insert({ name: "Cycling", exercise_category: "cardio" })
      .returning("*");

    const response = await authed(token)
      .post(`/api/workouts/${hiitWorkoutId}/sets`)
      .send({
        setType: "cardio",
        setNumber: 1,
        exerciseId: cardioExercise.id,
        durationSeconds: 300,
        intensityLevel: 7,
      });

    expect(response.status).toBe(400);
  });
});

describe("POST /api/workouts/:workoutId/sets (mind-body)", () => {
  let yogaWorkoutId: string;
  let flexibilityExerciseId: string;

  beforeEach(async () => {
    const [exercise] = await db("exercises")
      .insert({ name: "Downward Dog", exercise_category: "flexibility" })
      .returning("*");
    flexibilityExerciseId = exercise.id;

    const res = await authed(token)
      .post("/api/workouts")
      .send({
        name: "Yoga Flow",
        scheduledAt: futureDate,
        durationMinutes: 60,
        difficulty: "beginner",
        type: "yoga",
        exercises: [flexibilityExerciseId],
      });
    yogaWorkoutId = res.body.id;
  });

  it("creates a yoga set with durationSeconds and returns 201", async () => {
    const response = await authed(token)
      .post(`/api/workouts/${yogaWorkoutId}/sets`)
      .send({
        setType: "yoga",
        setNumber: 1,
        exerciseId: flexibilityExerciseId,
        durationSeconds: 60,
      });

    expect(response.status).toBe(201);
    expect(response.body.setType).toBe("yoga");
    expect(response.body.durationSeconds).toBe(60);
    expect(response.body.reps).toBeNull();
  });

  it("creates a yoga set with reps only", async () => {
    const response = await authed(token)
      .post(`/api/workouts/${yogaWorkoutId}/sets`)
      .send({
        setType: "yoga",
        setNumber: 1,
        exerciseId: flexibilityExerciseId,
        reps: 5,
      });

    expect(response.status).toBe(201);
    expect(response.body.reps).toBe(5);
    expect(response.body.durationSeconds).toBeNull();
  });

  it("returns 400 when neither durationSeconds nor reps is provided", async () => {
    const response = await authed(token)
      .post(`/api/workouts/${yogaWorkoutId}/sets`)
      .send({
        setType: "yoga",
        setNumber: 1,
        exerciseId: flexibilityExerciseId,
      });

    expect(response.status).toBe(400);
  });

  it("returns 400 when a strength exercise is used for a yoga set", async () => {
    const response = await authed(token)
      .post(`/api/workouts/${yogaWorkoutId}/sets`)
      .send({
        setType: "yoga",
        setNumber: 1,
        exerciseId: strengthExerciseId,
        durationSeconds: 60,
      });

    expect(response.status).toBe(400);
  });
});

describe("PATCH /api/workouts/:workoutId/sets/:setId", () => {
  it("updates a strength set and returns the updated set", async () => {
    const created = await authed(token)
      .post(`/api/workouts/${workoutId}/sets`)
      .send({
        setType: "strength",
        exerciseId: strengthExerciseId,
        setNumber: 1,
        reps: 10,
        weightKg: 80,
      });

    const response = await authed(token)
      .patch(`/api/workouts/${workoutId}/sets/${created.body.id}`)
      .send({ setType: "strength", reps: 12, weightKg: 85 });

    expect(response.status).toBe(200);
    expect(response.body.reps).toBe(12);
    expect(response.body.weightKg).toBe(85);
  });

  it("returns 400 when setType is missing from update body", async () => {
    const created = await authed(token)
      .post(`/api/workouts/${workoutId}/sets`)
      .send({
        setType: "strength",
        exerciseId: strengthExerciseId,
        setNumber: 1,
        reps: 10,
        weightKg: 80,
      });

    const response = await authed(token)
      .patch(`/api/workouts/${workoutId}/sets/${created.body.id}`)
      .send({ reps: 12 });

    expect(response.status).toBe(400);
  });

  it("returns 400 when setType in update does not match the existing set", async () => {
    const created = await authed(token)
      .post(`/api/workouts/${workoutId}/sets`)
      .send({
        setType: "strength",
        exerciseId: strengthExerciseId,
        setNumber: 1,
        reps: 10,
        weightKg: 80,
      });

    const response = await authed(token)
      .patch(`/api/workouts/${workoutId}/sets/${created.body.id}`)
      .send({ setType: "cardio", durationSeconds: 300, intensityLevel: 6 });

    expect(response.status).toBe(400);
  });

  it("returns 400 when updating exerciseId to wrong category", async () => {
    const created = await authed(token)
      .post(`/api/workouts/${workoutId}/sets`)
      .send({
        setType: "strength",
        exerciseId: strengthExerciseId,
        setNumber: 1,
        reps: 10,
        weightKg: 80,
      });

    const [cardioExercise] = await db("exercises")
      .insert({ name: "Running", exercise_category: "cardio" })
      .returning("*");

    const response = await authed(token)
      .patch(`/api/workouts/${workoutId}/sets/${created.body.id}`)
      .send({ setType: "strength", exerciseId: cardioExercise.id });

    expect(response.status).toBe(400);
  });

  it("returns 404 when set does not belong to this workout", async () => {
    const otherWorkoutRes = await authed(token)
      .post("/api/workouts")
      .send({
        name: "Other Workout",
        scheduledAt: futureDate,
        durationMinutes: 45,
        difficulty: "intermediate",
        type: "strength",
        exercises: [strengthExerciseId],
      });

    const created = await authed(token)
      .post(`/api/workouts/${workoutId}/sets`)
      .send({
        setType: "strength",
        exerciseId: strengthExerciseId,
        setNumber: 1,
        reps: 10,
        weightKg: 80,
      });

    const response = await authed(token)
      .patch(`/api/workouts/${otherWorkoutRes.body.id}/sets/${created.body.id}`)
      .send({ setType: "strength", reps: 12 });

    expect(response.status).toBe(404);
  });
});

describe("DELETE /api/workouts/:workoutId/sets/:setId", () => {
  it("deletes a set and returns 204", async () => {
    const created = await authed(token)
      .post(`/api/workouts/${workoutId}/sets`)
      .send({
        setType: "strength",
        exerciseId: strengthExerciseId,
        setNumber: 1,
        reps: 10,
        weightKg: 80,
      });

    const response = await authed(token).delete(
      `/api/workouts/${workoutId}/sets/${created.body.id}`,
    );

    expect(response.status).toBe(204);
  });

  it("returns 404 when set does not belong to this workout", async () => {
    const otherWorkoutRes = await authed(token)
      .post("/api/workouts")
      .send({
        name: "Other Workout",
        scheduledAt: futureDate,
        durationMinutes: 45,
        difficulty: "intermediate",
        type: "strength",
        exercises: [strengthExerciseId],
      });

    const created = await authed(token)
      .post(`/api/workouts/${workoutId}/sets`)
      .send({
        setType: "strength",
        exerciseId: strengthExerciseId,
        setNumber: 1,
        reps: 10,
        weightKg: 80,
      });

    const response = await authed(token).delete(
      `/api/workouts/${otherWorkoutRes.body.id}/sets/${created.body.id}`,
    );

    expect(response.status).toBe(404);
  });
});

describe("GET /api/workouts/:id (sets embedded)", () => {
  it("returns the workout with sets and exercise details embedded", async () => {
    await authed(token).post(`/api/workouts/${workoutId}/sets`).send({
      setType: "strength",
      exerciseId: strengthExerciseId,
      setNumber: 1,
      reps: 10,
      weightKg: 80,
    });
    await authed(token).post(`/api/workouts/${workoutId}/sets`).send({
      setType: "strength",
      exerciseId: strengthExerciseId,
      setNumber: 2,
      reps: 8,
      weightKg: 85,
    });

    const response = await authed(token).get(`/api/workouts/${workoutId}`);

    expect(response.status).toBe(200);
    expect(response.body.sets).toHaveLength(2);
    expect(response.body.sets[0].exercise.name).toBe("Bench Press");
    expect(response.body.sets[0].exercise.muscleGroup).toBe("Chest");
    expect(response.body.sets[0].exercise.exerciseCategory).toBe("strength");
    expect(response.body.sets[0].reps).toBe(10);
  });

  it("returns sets with exercise details for cardio workout", async () => {
    const [cardioExercise] = await db("exercises")
      .insert({ name: "Running", exercise_category: "cardio" })
      .returning("*");

    const cardioRes = await authed(token)
      .post("/api/workouts")
      .send({
        name: "Run",
        scheduledAt: futureDate,
        durationMinutes: 30,
        difficulty: "beginner",
        type: "cardio",
        exercises: [cardioExercise.id],
      });
    const cardioId = cardioRes.body.id;

    await authed(token).post(`/api/workouts/${cardioId}/sets`).send({
      setType: "cardio",
      setNumber: 1,
      exerciseId: cardioExercise.id,
      durationSeconds: 1800,
      intensityLevel: 6,
    });

    const response = await authed(token).get(`/api/workouts/${cardioId}`);

    expect(response.status).toBe(200);
    expect(response.body.sets).toHaveLength(1);
    expect(response.body.sets[0].exercise.name).toBe("Running");
    expect(response.body.sets[0].exercise.exerciseCategory).toBe("cardio");
    expect(response.body.sets[0].durationSeconds).toBe(1800);
  });

  it("returns empty sets array when workout has no sets", async () => {
    const response = await authed(token).get(`/api/workouts/${workoutId}`);

    expect(response.status).toBe(200);
    expect(response.body.sets).toEqual([]);
  });
});
