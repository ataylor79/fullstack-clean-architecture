import { db } from "@infrastructure/database/db";
import { authed, registerAndLogin } from "tests/helpers/auth";
import { beforeEach, describe, expect, it } from "vitest";

let token: string;
let planId: string;
let exerciseId: string;
let emailCounter = 0;

async function buildReadyPlan(t: string) {
  const [ex] = await db("exercises")
    .insert({
      name: `Exercise ${Math.random()}`,
      exercise_category: "strength",
    })
    .returning("*");

  const { body: tmpl } = await authed(t).post("/api/templates").send({
    name: "Push Day",
    difficulty: "intermediate",
    type: "strength",
  });

  const { body: te } = await authed(t)
    .post(`/api/templates/${tmpl.id}/exercises`)
    .send({ exerciseId: ex.id, section: "main" });

  await authed(t)
    .post(`/api/templates/${tmpl.id}/exercises/${te.id}/sets`)
    .send({ setType: "strength", setNumber: 1, reps: 10, weightKg: 80 });

  const { body: plan } = await authed(t)
    .post("/api/plans")
    .send({
      templateId: tmpl.id,
      daysOfWeek: ["monday", "wednesday"],
      numWeeks: 4,
    });

  return { planId: plan.id, exerciseId: ex.id };
}

beforeEach(async () => {
  emailCounter++;
  token = await registerAndLogin(`loguser${emailCounter}@example.com`);
  const result = await buildReadyPlan(token);
  planId = result.planId;
  exerciseId = result.exerciseId;
});

// ─── POST /api/plans/:planId/workouts ─────────────────────────────────────────

describe("POST /api/plans/:planId/workouts", () => {
  it("creates a workout pre-populated with template exercises and returns 201", async () => {
    const scheduledAt = new Date(Date.now() + 86400000).toISOString();
    const res = await authed(token)
      .post(`/api/plans/${planId}/workouts`)
      .send({ scheduledAt });

    expect(res.status).toBe(201);
    expect(res.body.planId).toBe(planId);
    expect(res.body.completedAt).toBeNull();
    expect(res.body.rating).toBeNull();
    expect(res.body.notes).toBeNull();
    expect(res.body.exercises).toHaveLength(1);
    expect(res.body.exercises[0].exerciseId).toBe(exerciseId);
  });

  it("auto-generates the workout name from template name and date", async () => {
    const res = await authed(token)
      .post(`/api/plans/${planId}/workouts`)
      .send({ scheduledAt: "2026-05-01T09:00:00.000Z" });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Push Day — 2026-05-01");
  });

  it("inherits difficulty and type from the template", async () => {
    const res = await authed(token)
      .post(`/api/plans/${planId}/workouts`)
      .send({ scheduledAt: new Date(Date.now() + 86400000).toISOString() });

    expect(res.status).toBe(201);
    expect(res.body.difficulty).toBe("intermediate");
    expect(res.body.type).toBe("strength");
  });

  it("returns 400 when scheduledAt is missing", async () => {
    const res = await authed(token)
      .post(`/api/plans/${planId}/workouts`)
      .send({});
    expect(res.status).toBe(400);
  });

  it("returns 404 for an unknown planId", async () => {
    const res = await authed(token)
      .post("/api/plans/00000000-0000-0000-0000-000000000000/workouts")
      .send({ scheduledAt: new Date().toISOString() });
    expect(res.status).toBe(404);
  });

  it("returns 404 for another user's plan", async () => {
    const other = await registerAndLogin(`other${emailCounter}@example.com`);
    const res = await authed(other)
      .post(`/api/plans/${planId}/workouts`)
      .send({ scheduledAt: new Date().toISOString() });
    expect(res.status).toBe(404);
  });
});

// ─── GET /api/plans/:planId/workouts ──────────────────────────────────────────

describe("GET /api/plans/:planId/workouts", () => {
  it("returns workouts linked to the plan", async () => {
    await authed(token)
      .post(`/api/plans/${planId}/workouts`)
      .send({ scheduledAt: new Date(Date.now() + 86400000).toISOString() });

    const res = await authed(token).get(`/api/plans/${planId}/workouts`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].planId).toBe(planId);
  });

  it("returns empty array when no workouts exist for the plan", async () => {
    const res = await authed(token).get(`/api/plans/${planId}/workouts`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("returns 404 for another user's plan", async () => {
    const other = await registerAndLogin(`other2${emailCounter}@example.com`);
    const res = await authed(other).get(`/api/plans/${planId}/workouts`);
    expect(res.status).toBe(404);
  });
});

// ─── Full workout completion flow ─────────────────────────────────────────────

describe("Full workout completion flow", () => {
  it("can log sets then complete with rating and notes", async () => {
    const scheduledAt = new Date(Date.now() - 7200000).toISOString();
    const { body: workout } = await authed(token)
      .post(`/api/plans/${planId}/workouts`)
      .send({ scheduledAt });

    await authed(token).post(`/api/workouts/${workout.id}/sets`).send({
      setType: "strength",
      exerciseId,
      setNumber: 1,
      reps: 10,
      weightKg: 80,
    });

    const completedAt = new Date(Date.now() - 3600000).toISOString();
    const res = await authed(token).patch(`/api/workouts/${workout.id}`).send({
      completedAt,
      durationMinutes: 45,
      rating: 4,
      notes: "Felt strong today",
    });

    expect(res.status).toBe(200);
    expect(res.body.completedAt).not.toBeNull();
    expect(res.body.rating).toBe(4);
    expect(res.body.notes).toBe("Felt strong today");
    expect(res.body.durationMinutes).toBe(45);
  });

  it("allows updating name even after sets are logged", async () => {
    const scheduledAt = new Date(Date.now() - 7200000).toISOString();
    const { body: workout } = await authed(token)
      .post(`/api/plans/${planId}/workouts`)
      .send({ scheduledAt });

    await authed(token).post(`/api/workouts/${workout.id}/sets`).send({
      setType: "strength",
      exerciseId,
      setNumber: 1,
      reps: 10,
      weightKg: 80,
    });

    const res = await authed(token)
      .patch(`/api/workouts/${workout.id}`)
      .send({ name: "Updated Name" });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Updated Name");
  });

  it("rejects structural field changes (difficulty) after sets are logged", async () => {
    const scheduledAt = new Date(Date.now() - 7200000).toISOString();
    const { body: workout } = await authed(token)
      .post(`/api/plans/${planId}/workouts`)
      .send({ scheduledAt });

    await authed(token).post(`/api/workouts/${workout.id}/sets`).send({
      setType: "strength",
      exerciseId,
      setNumber: 1,
      reps: 10,
      weightKg: 80,
    });

    const res = await authed(token)
      .patch(`/api/workouts/${workout.id}`)
      .send({ difficulty: "advanced" });

    expect(res.status).toBe(409);
  });

  it("rejects exercise list changes after sets are logged", async () => {
    const scheduledAt = new Date(Date.now() - 7200000).toISOString();
    const { body: workout } = await authed(token)
      .post(`/api/plans/${planId}/workouts`)
      .send({ scheduledAt });

    await authed(token).post(`/api/workouts/${workout.id}/sets`).send({
      setType: "strength",
      exerciseId,
      setNumber: 1,
      reps: 10,
      weightKg: 80,
    });

    const res = await authed(token)
      .patch(`/api/workouts/${workout.id}`)
      .send({ exercises: [exerciseId] });

    expect(res.status).toBe(409);
  });
});

// ─── Rating validation ─────────────────────────────────────────────────────────

describe("PATCH /api/workouts/:id rating and notes", () => {
  let workoutId: string;

  beforeEach(async () => {
    const [ex] = await db("exercises")
      .insert({
        name: `RatingEx${emailCounter}`,
        exercise_category: "strength",
      })
      .returning("*");
    const { body: w } = await authed(token)
      .post("/api/workouts")
      .send({
        name: "Rate Me",
        scheduledAt: new Date(Date.now() - 7200000).toISOString(),
        durationMinutes: 30,
        difficulty: "beginner",
        type: "strength",
        exercises: [ex.id],
      });
    workoutId = w.id;
  });

  it("returns 400 when rating a workout that has not been completed", async () => {
    const res = await authed(token)
      .patch(`/api/workouts/${workoutId}`)
      .send({ rating: 3 });
    expect(res.status).toBe(400);
  });

  it("accepts ratings 1 through 5 on a completed workout", async () => {
    const completedAt = new Date(Date.now() - 3600000).toISOString();
    await authed(token)
      .patch(`/api/workouts/${workoutId}`)
      .send({ completedAt });

    for (const rating of [1, 2, 3, 4, 5]) {
      const res = await authed(token)
        .patch(`/api/workouts/${workoutId}`)
        .send({ rating });
      expect(res.status).toBe(200);
      expect(res.body.rating).toBe(rating);
    }
  });

  it("returns 400 for rating 0", async () => {
    const res = await authed(token)
      .patch(`/api/workouts/${workoutId}`)
      .send({ rating: 0 });
    expect(res.status).toBe(400);
  });

  it("returns 400 for rating 6", async () => {
    const res = await authed(token)
      .patch(`/api/workouts/${workoutId}`)
      .send({ rating: 6 });
    expect(res.status).toBe(400);
  });

  it("allows clearing rating by setting null", async () => {
    const completedAt = new Date(Date.now() - 3600000).toISOString();
    await authed(token)
      .patch(`/api/workouts/${workoutId}`)
      .send({ completedAt });
    await authed(token).patch(`/api/workouts/${workoutId}`).send({ rating: 5 });
    const res = await authed(token)
      .patch(`/api/workouts/${workoutId}`)
      .send({ rating: null });
    expect(res.status).toBe(200);
    expect(res.body.rating).toBeNull();
  });

  it("allows rating in the same request as completedAt", async () => {
    const completedAt = new Date(Date.now() - 3600000).toISOString();
    const res = await authed(token)
      .patch(`/api/workouts/${workoutId}`)
      .send({ completedAt, rating: 4 });
    expect(res.status).toBe(200);
    expect(res.body.rating).toBe(4);
  });

  it("accepts and returns notes", async () => {
    const res = await authed(token)
      .patch(`/api/workouts/${workoutId}`)
      .send({ notes: "Great session" });
    expect(res.status).toBe(200);
    expect(res.body.notes).toBe("Great session");
  });

  it("allows clearing notes by setting null", async () => {
    await authed(token)
      .patch(`/api/workouts/${workoutId}`)
      .send({ notes: "Some notes" });
    const res = await authed(token)
      .patch(`/api/workouts/${workoutId}`)
      .send({ notes: null });
    expect(res.status).toBe(200);
    expect(res.body.notes).toBeNull();
  });
});
