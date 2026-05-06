import { db } from "@infrastructure/database/db";
import { authed, registerAndLogin } from "tests/helpers/auth";
import { beforeEach, describe, expect, it } from "vitest";

let token: string;
let strengthExerciseId: string;
let flexibilityExerciseId: string;
let emailCounter = 0;

beforeEach(async () => {
  emailCounter++;
  token = await registerAndLogin(`templateuser${emailCounter}@example.com`);

  const [strength, flex] = await db("exercises")
    .insert([
      { name: `Bench Press ${emailCounter}`, exercise_category: "strength" },
      {
        name: `Downward Dog ${emailCounter}`,
        exercise_category: "flexibility",
      },
    ])
    .returning("*");
  strengthExerciseId = strength.id;
  flexibilityExerciseId = flex.id;
});

async function createTemplate(
  t: string,
  overrides: Record<string, unknown> = {},
) {
  return authed(t)
    .post("/api/templates")
    .send({
      name: "My Template",
      difficulty: "intermediate",
      type: "strength",
      ...overrides,
    });
}

// ─── POST /api/templates ──────────────────────────────────────────────────────

describe("POST /api/templates", () => {
  it("creates a template and returns 201", async () => {
    const res = await createTemplate(token);
    expect(res.status).toBe(201);
    expect(res.body.name).toBe("My Template");
    expect(res.body.difficulty).toBe("intermediate");
    expect(res.body.type).toBe("strength");
    expect(res.body.id).toBeDefined();
    expect(res.body.userId).toBeDefined();
  });

  it("returns 400 for missing required fields", async () => {
    const res = await authed(token)
      .post("/api/templates")
      .send({ name: "No type" });
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid difficulty", async () => {
    const res = await createTemplate(token, { difficulty: "legendary" });
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid type", async () => {
    const res = await createTemplate(token, { type: "dancing" });
    expect(res.status).toBe(400);
  });
});

// ─── GET /api/templates ───────────────────────────────────────────────────────

describe("GET /api/templates", () => {
  it("returns empty array for new user", async () => {
    const res = await authed(token).get("/api/templates");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("returns all of the user's templates", async () => {
    await createTemplate(token, { name: "T1" });
    await createTemplate(token, { name: "T2" });
    const res = await authed(token).get("/api/templates");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  it("does not return other users' templates", async () => {
    const other = await registerAndLogin(`other${emailCounter}@example.com`);
    await createTemplate(other);
    const res = await authed(token).get("/api/templates");
    expect(res.body).toHaveLength(0);
  });
});

// ─── GET /api/templates/:id ───────────────────────────────────────────────────

describe("GET /api/templates/:id", () => {
  it("returns template with exercises and nested sets", async () => {
    const { body: tmpl } = await createTemplate(token);

    const { body: te } = await authed(token)
      .post(`/api/templates/${tmpl.id}/exercises`)
      .send({ exerciseId: strengthExerciseId, section: "main" });

    await authed(token)
      .post(`/api/templates/${tmpl.id}/exercises/${te.id}/sets`)
      .send({ setType: "strength", setNumber: 1, reps: 10, weightKg: 80 });

    const res = await authed(token).get(`/api/templates/${tmpl.id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(tmpl.id);
    expect(res.body.exercises).toHaveLength(1);
    expect(res.body.exercises[0].section).toBe("main");
    expect(res.body.exercises[0].sets).toHaveLength(1);
    expect(res.body.exercises[0].sets[0].reps).toBe(10);
    expect(res.body.exercises[0].sets[0].weightKg).toBe(80);
  });

  it("returns exercises ordered by section then orderIndex", async () => {
    const { body: tmpl } = await createTemplate(token);
    const [ex2] = await db("exercises")
      .insert({ name: `Squat ${emailCounter}`, exercise_category: "strength" })
      .returning("*");

    await authed(token)
      .post(`/api/templates/${tmpl.id}/exercises`)
      .send({ exerciseId: strengthExerciseId, section: "main" });
    await authed(token)
      .post(`/api/templates/${tmpl.id}/exercises`)
      .send({ exerciseId: ex2.id, section: "main" });
    await authed(token)
      .post(`/api/templates/${tmpl.id}/exercises`)
      .send({ exerciseId: flexibilityExerciseId, section: "warmup" });

    const res = await authed(token).get(`/api/templates/${tmpl.id}`);
    const sections = res.body.exercises.map(
      (e: { section: string }) => e.section,
    );
    expect(sections).toEqual(["main", "main", "warmup"]);
  });

  it("returns 404 for unknown id", async () => {
    const res = await authed(token).get(
      "/api/templates/00000000-0000-0000-0000-000000000000",
    );
    expect(res.status).toBe(404);
  });

  it("returns 404 for another user's template", async () => {
    const other = await registerAndLogin(`other2${emailCounter}@example.com`);
    const { body: tmpl } = await createTemplate(other);
    const res = await authed(token).get(`/api/templates/${tmpl.id}`);
    expect(res.status).toBe(404);
  });
});

// ─── DELETE /api/templates/:id ────────────────────────────────────────────────

describe("DELETE /api/templates/:id", () => {
  it("deletes template and returns 204", async () => {
    const { body: tmpl } = await createTemplate(token);
    const res = await authed(token).delete(`/api/templates/${tmpl.id}`);
    expect(res.status).toBe(204);
    const check = await authed(token).get(`/api/templates/${tmpl.id}`);
    expect(check.status).toBe(404);
  });

  it("returns 404 for unknown id", async () => {
    const res = await authed(token).delete(
      "/api/templates/00000000-0000-0000-0000-000000000000",
    );
    expect(res.status).toBe(404);
  });

  it("returns 409 if template is in use by a plan", async () => {
    const { body: tmpl } = await createTemplate(token);
    const { body: te } = await authed(token)
      .post(`/api/templates/${tmpl.id}/exercises`)
      .send({ exerciseId: strengthExerciseId, section: "main" });
    await authed(token)
      .post(`/api/templates/${tmpl.id}/exercises/${te.id}/sets`)
      .send({ setType: "strength", setNumber: 1, reps: 10, weightKg: 80 });
    await authed(token)
      .post("/api/plans")
      .send({
        templateId: tmpl.id,
        daysOfWeek: ["monday"],
        numWeeks: 4,
      });

    const res = await authed(token).delete(`/api/templates/${tmpl.id}`);
    expect(res.status).toBe(409);
  });
});

// ─── POST /api/templates/:id/exercises ───────────────────────────────────────

describe("POST /api/templates/:templateId/exercises", () => {
  let templateId: string;

  beforeEach(async () => {
    const { body } = await createTemplate(token);
    templateId = body.id;
  });

  it("adds a main exercise and returns 201", async () => {
    const res = await authed(token)
      .post(`/api/templates/${templateId}/exercises`)
      .send({ exerciseId: strengthExerciseId, section: "main" });
    expect(res.status).toBe(201);
    expect(res.body.section).toBe("main");
    expect(res.body.exerciseId).toBe(strengthExerciseId);
    expect(res.body.orderIndex).toBe(1);
  });

  it("adds warmup and cooldown exercises", async () => {
    const warmup = await authed(token)
      .post(`/api/templates/${templateId}/exercises`)
      .send({ exerciseId: flexibilityExerciseId, section: "warmup" });
    expect(warmup.status).toBe(201);
    expect(warmup.body.section).toBe("warmup");

    const cooldown = await authed(token)
      .post(`/api/templates/${templateId}/exercises`)
      .send({ exerciseId: flexibilityExerciseId, section: "cooldown" });
    expect(cooldown.status).toBe(201);
    expect(cooldown.body.section).toBe("cooldown");
  });

  it("auto-increments orderIndex within section", async () => {
    const [ex2] = await db("exercises")
      .insert({ name: `Squat ${emailCounter}`, exercise_category: "strength" })
      .returning("*");

    const r1 = await authed(token)
      .post(`/api/templates/${templateId}/exercises`)
      .send({ exerciseId: strengthExerciseId, section: "main" });
    const r2 = await authed(token)
      .post(`/api/templates/${templateId}/exercises`)
      .send({ exerciseId: ex2.id, section: "main" });

    expect(r1.body.orderIndex).toBe(1);
    expect(r2.body.orderIndex).toBe(2);
  });

  it("orderIndex is independent per section", async () => {
    const r1 = await authed(token)
      .post(`/api/templates/${templateId}/exercises`)
      .send({ exerciseId: strengthExerciseId, section: "main" });
    const r2 = await authed(token)
      .post(`/api/templates/${templateId}/exercises`)
      .send({ exerciseId: flexibilityExerciseId, section: "warmup" });

    expect(r1.body.orderIndex).toBe(1);
    expect(r2.body.orderIndex).toBe(1);
  });

  it("returns 400 for invalid section", async () => {
    const res = await authed(token)
      .post(`/api/templates/${templateId}/exercises`)
      .send({ exerciseId: strengthExerciseId, section: "invalid" });
    expect(res.status).toBe(400);
  });

  it("returns 404 for unknown exercise", async () => {
    const res = await authed(token)
      .post(`/api/templates/${templateId}/exercises`)
      .send({
        exerciseId: "00000000-0000-0000-0000-000000000000",
        section: "main",
      });
    expect(res.status).toBe(404);
  });

  it("returns 404 for unknown template", async () => {
    const res = await authed(token)
      .post("/api/templates/00000000-0000-0000-0000-000000000000/exercises")
      .send({ exerciseId: strengthExerciseId, section: "main" });
    expect(res.status).toBe(404);
  });
});

// ─── DELETE /api/templates/:templateId/exercises/:templateExerciseId ─────────

describe("DELETE /api/templates/:templateId/exercises/:templateExerciseId", () => {
  let templateId: string;
  let templateExerciseId: string;

  beforeEach(async () => {
    const { body: tmpl } = await createTemplate(token);
    templateId = tmpl.id;
    const { body: te } = await authed(token)
      .post(`/api/templates/${templateId}/exercises`)
      .send({ exerciseId: strengthExerciseId, section: "main" });
    templateExerciseId = te.id;
  });

  it("removes exercise and returns 204", async () => {
    const res = await authed(token).delete(
      `/api/templates/${templateId}/exercises/${templateExerciseId}`,
    );
    expect(res.status).toBe(204);
  });

  it("returns 404 for unknown templateExerciseId", async () => {
    const res = await authed(token).delete(
      `/api/templates/${templateId}/exercises/00000000-0000-0000-0000-000000000000`,
    );
    expect(res.status).toBe(404);
  });

  it("returns 409 if template is in use by a plan", async () => {
    await authed(token)
      .post(`/api/templates/${templateId}/exercises/${templateExerciseId}/sets`)
      .send({ setType: "strength", setNumber: 1, reps: 10, weightKg: 80 });
    await authed(token)
      .post("/api/plans")
      .send({
        templateId,
        daysOfWeek: ["monday"],
        numWeeks: 4,
      });

    const res = await authed(token).delete(
      `/api/templates/${templateId}/exercises/${templateExerciseId}`,
    );
    expect(res.status).toBe(409);
  });
});

// ─── POST /api/templates/:templateId/exercises/:templateExerciseId/sets ──────

describe("POST /api/templates/:templateId/exercises/:templateExerciseId/sets", () => {
  let templateId: string;
  let templateExerciseId: string;

  beforeEach(async () => {
    const { body: tmpl } = await createTemplate(token);
    templateId = tmpl.id;
    const { body: te } = await authed(token)
      .post(`/api/templates/${templateId}/exercises`)
      .send({ exerciseId: strengthExerciseId, section: "main" });
    templateExerciseId = te.id;
  });

  it("adds a strength set and returns 201", async () => {
    const res = await authed(token)
      .post(`/api/templates/${templateId}/exercises/${templateExerciseId}/sets`)
      .send({ setType: "strength", setNumber: 1, reps: 10, weightKg: 80 });
    expect(res.status).toBe(201);
    expect(res.body.setType).toBe("strength");
    expect(res.body.reps).toBe(10);
    expect(res.body.weightKg).toBe(80);
    expect(res.body.setNumber).toBe(1);
    expect(res.body.templateExerciseId).toBe(templateExerciseId);
  });

  it("allows multiple sets with different reps", async () => {
    await authed(token)
      .post(`/api/templates/${templateId}/exercises/${templateExerciseId}/sets`)
      .send({ setType: "strength", setNumber: 1, reps: 10, weightKg: 80 });
    const res = await authed(token)
      .post(`/api/templates/${templateId}/exercises/${templateExerciseId}/sets`)
      .send({ setType: "strength", setNumber: 2, reps: 8, weightKg: 85 });
    expect(res.status).toBe(201);
    expect(res.body.setNumber).toBe(2);
    expect(res.body.reps).toBe(8);
  });

  it("returns 400 for missing required fields (strength needs weightKg)", async () => {
    const res = await authed(token)
      .post(`/api/templates/${templateId}/exercises/${templateExerciseId}/sets`)
      .send({ setType: "strength", setNumber: 1, reps: 10 });
    expect(res.status).toBe(400);
  });

  it("returns 409 for duplicate set number", async () => {
    await authed(token)
      .post(`/api/templates/${templateId}/exercises/${templateExerciseId}/sets`)
      .send({ setType: "strength", setNumber: 1, reps: 10, weightKg: 80 });
    const res = await authed(token)
      .post(`/api/templates/${templateId}/exercises/${templateExerciseId}/sets`)
      .send({ setType: "strength", setNumber: 1, reps: 12, weightKg: 85 });
    expect(res.status).toBe(409);
  });

  it("returns 404 for unknown template exercise", async () => {
    const res = await authed(token)
      .post(
        `/api/templates/${templateId}/exercises/00000000-0000-0000-0000-000000000000/sets`,
      )
      .send({ setType: "strength", setNumber: 1, reps: 10, weightKg: 80 });
    expect(res.status).toBe(404);
  });

  it("returns 409 when template is in use by a plan", async () => {
    await authed(token)
      .post(`/api/templates/${templateId}/exercises/${templateExerciseId}/sets`)
      .send({ setType: "strength", setNumber: 1, reps: 10, weightKg: 80 });
    await authed(token)
      .post("/api/plans")
      .send({
        templateId,
        daysOfWeek: ["monday"],
        numWeeks: 4,
      });
    const res = await authed(token)
      .post(`/api/templates/${templateId}/exercises/${templateExerciseId}/sets`)
      .send({ setType: "strength", setNumber: 2, reps: 8, weightKg: 85 });
    expect(res.status).toBe(409);
  });
});

// ─── PATCH /api/templates/:templateId/exercises/:templateExerciseId/sets/:setId

describe("PATCH /api/templates/:templateId/exercises/:templateExerciseId/sets/:setId", () => {
  let templateId: string;
  let templateExerciseId: string;
  let setId: string;

  beforeEach(async () => {
    const { body: tmpl } = await createTemplate(token);
    templateId = tmpl.id;
    const { body: te } = await authed(token)
      .post(`/api/templates/${templateId}/exercises`)
      .send({ exerciseId: strengthExerciseId, section: "main" });
    templateExerciseId = te.id;
    const { body: s } = await authed(token)
      .post(`/api/templates/${templateId}/exercises/${templateExerciseId}/sets`)
      .send({ setType: "strength", setNumber: 1, reps: 10, weightKg: 80 });
    setId = s.id;
  });

  it("updates a set and returns 200", async () => {
    const res = await authed(token)
      .patch(
        `/api/templates/${templateId}/exercises/${templateExerciseId}/sets/${setId}`,
      )
      .send({ setType: "strength", reps: 12, weightKg: 85 });
    expect(res.status).toBe(200);
    expect(res.body.reps).toBe(12);
    expect(res.body.weightKg).toBe(85);
  });

  it("returns 404 for unknown set", async () => {
    const res = await authed(token)
      .patch(
        `/api/templates/${templateId}/exercises/${templateExerciseId}/sets/00000000-0000-0000-0000-000000000000`,
      )
      .send({ setType: "strength", reps: 12 });
    expect(res.status).toBe(404);
  });

  it("returns 409 when template is in use by a plan", async () => {
    await authed(token)
      .post("/api/plans")
      .send({
        templateId,
        daysOfWeek: ["monday"],
        numWeeks: 4,
      });
    const res = await authed(token)
      .patch(
        `/api/templates/${templateId}/exercises/${templateExerciseId}/sets/${setId}`,
      )
      .send({ setType: "strength", reps: 12 });
    expect(res.status).toBe(409);
  });
});

// ─── DELETE /api/templates/:templateId/exercises/:templateExerciseId/sets/:setId

describe("DELETE /api/templates/:templateId/exercises/:templateExerciseId/sets/:setId", () => {
  let templateId: string;
  let templateExerciseId: string;
  let setId: string;

  beforeEach(async () => {
    const { body: tmpl } = await createTemplate(token);
    templateId = tmpl.id;
    const { body: te } = await authed(token)
      .post(`/api/templates/${templateId}/exercises`)
      .send({ exerciseId: strengthExerciseId, section: "main" });
    templateExerciseId = te.id;
    const { body: s } = await authed(token)
      .post(`/api/templates/${templateId}/exercises/${templateExerciseId}/sets`)
      .send({ setType: "strength", setNumber: 1, reps: 10, weightKg: 80 });
    setId = s.id;
  });

  it("deletes a set and returns 204", async () => {
    const res = await authed(token).delete(
      `/api/templates/${templateId}/exercises/${templateExerciseId}/sets/${setId}`,
    );
    expect(res.status).toBe(204);
  });

  it("returns 404 for unknown set", async () => {
    const res = await authed(token).delete(
      `/api/templates/${templateId}/exercises/${templateExerciseId}/sets/00000000-0000-0000-0000-000000000000`,
    );
    expect(res.status).toBe(404);
  });

  it("returns 409 when template is in use by a plan", async () => {
    await authed(token)
      .post("/api/plans")
      .send({
        templateId,
        daysOfWeek: ["monday"],
        numWeeks: 4,
      });
    const res = await authed(token).delete(
      `/api/templates/${templateId}/exercises/${templateExerciseId}/sets/${setId}`,
    );
    expect(res.status).toBe(409);
  });
});

// ─── PATCH /api/templates/:id ─────────────────────────────────────────────────

describe("PATCH /api/templates/:id", () => {
  it("updates the template name", async () => {
    const { body: tmpl } = await createTemplate(token);
    const res = await authed(token)
      .patch(`/api/templates/${tmpl.id}`)
      .send({ name: "Updated Name" });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Updated Name");
  });

  it("updates difficulty", async () => {
    const { body: tmpl } = await createTemplate(token);
    const res = await authed(token)
      .patch(`/api/templates/${tmpl.id}`)
      .send({ difficulty: "advanced" });
    expect(res.status).toBe(200);
    expect(res.body.difficulty).toBe("advanced");
  });

  it("updates type", async () => {
    const { body: tmpl } = await createTemplate(token);
    const res = await authed(token)
      .patch(`/api/templates/${tmpl.id}`)
      .send({ type: "cardio" });
    expect(res.status).toBe(200);
    expect(res.body.type).toBe("cardio");
  });

  it("returns 400 for invalid difficulty", async () => {
    const { body: tmpl } = await createTemplate(token);
    const res = await authed(token)
      .patch(`/api/templates/${tmpl.id}`)
      .send({ difficulty: "legendary" });
    expect(res.status).toBe(400);
  });

  it("returns 404 for another user's template", async () => {
    const { body: tmpl } = await createTemplate(token);
    const other = await registerAndLogin(
      `patchother${emailCounter}@example.com`,
    );
    const res = await authed(other)
      .patch(`/api/templates/${tmpl.id}`)
      .send({ name: "Hijack" });
    expect(res.status).toBe(404);
  });

  it("returns 404 for unknown template", async () => {
    const res = await authed(token)
      .patch("/api/templates/00000000-0000-0000-0000-000000000000")
      .send({ name: "Ghost" });
    expect(res.status).toBe(404);
  });
});
