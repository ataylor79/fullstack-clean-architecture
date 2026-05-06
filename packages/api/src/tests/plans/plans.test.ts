import { db } from "@infrastructure/database/db";
import { authed, registerAndLogin } from "tests/helpers/auth";
import { beforeEach, describe, expect, it } from "vitest";

let token: string;
let templateId: string;
let emailCounter = 0;

async function buildReadyTemplate(t: string) {
  const [ex] = await db("exercises")
    .insert({
      name: `Exercise ${Math.random()}`,
      exercise_category: "strength",
    })
    .returning("*");

  const { body: tmpl } = await authed(t).post("/api/templates").send({
    name: "Plan Template",
    difficulty: "beginner",
    type: "strength",
  });

  const { body: te } = await authed(t)
    .post(`/api/templates/${tmpl.id}/exercises`)
    .send({ exerciseId: ex.id, section: "main" });

  await authed(t)
    .post(`/api/templates/${tmpl.id}/exercises/${te.id}/sets`)
    .send({ setType: "strength", setNumber: 1, reps: 10, weightKg: 60 });

  return tmpl.id;
}

beforeEach(async () => {
  emailCounter++;
  token = await registerAndLogin(`planuser${emailCounter}@example.com`);
  templateId = await buildReadyTemplate(token);
});

// ─── POST /api/plans ──────────────────────────────────────────────────────────

describe("POST /api/plans", () => {
  it("creates a plan and returns 201", async () => {
    const res = await authed(token)
      .post("/api/plans")
      .send({
        templateId,
        daysOfWeek: ["monday", "wednesday", "friday"],
        numWeeks: 4,
      });
    expect(res.status).toBe(201);
    expect(res.body.templateId).toBe(templateId);
    expect(res.body.daysOfWeek).toEqual(["monday", "wednesday", "friday"]);
    expect(res.body.numWeeks).toBe(4);
    expect(res.body.id).toBeDefined();
  });

  it("returns 400 for empty daysOfWeek", async () => {
    const res = await authed(token).post("/api/plans").send({
      templateId,
      daysOfWeek: [],
      numWeeks: 4,
    });
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid day name", async () => {
    const res = await authed(token)
      .post("/api/plans")
      .send({
        templateId,
        daysOfWeek: ["funday"],
        numWeeks: 4,
      });
    expect(res.status).toBe(400);
  });

  it("returns 400 for numWeeks less than 1", async () => {
    const res = await authed(token)
      .post("/api/plans")
      .send({
        templateId,
        daysOfWeek: ["monday"],
        numWeeks: 0,
      });
    expect(res.status).toBe(400);
  });

  it("returns 404 for unknown template", async () => {
    const res = await authed(token)
      .post("/api/plans")
      .send({
        templateId: "00000000-0000-0000-0000-000000000000",
        daysOfWeek: ["monday"],
        numWeeks: 4,
      });
    expect(res.status).toBe(404);
  });

  it("returns 404 for another user's template", async () => {
    const other = await registerAndLogin(`other${emailCounter}@example.com`);
    const otherId = await buildReadyTemplate(other);
    const res = await authed(token)
      .post("/api/plans")
      .send({
        templateId: otherId,
        daysOfWeek: ["monday"],
        numWeeks: 4,
      });
    expect(res.status).toBe(404);
  });

  it("returns 422 if a main exercise has no sets", async () => {
    const [ex] = await db("exercises")
      .insert({ name: "Bare Exercise", exercise_category: "strength" })
      .returning("*");
    const { body: tmpl } = await authed(token).post("/api/templates").send({
      name: "Incomplete Template",
      difficulty: "beginner",
      type: "strength",
    });
    await authed(token)
      .post(`/api/templates/${tmpl.id}/exercises`)
      .send({ exerciseId: ex.id, section: "main" });

    const res = await authed(token)
      .post("/api/plans")
      .send({
        templateId: tmpl.id,
        daysOfWeek: ["monday"],
        numWeeks: 2,
      });
    expect(res.status).toBe(422);
  });

  it("allows plan creation when only warmup/cooldown have no sets", async () => {
    const [flex] = await db("exercises")
      .insert({ name: "Yoga Stretch", exercise_category: "flexibility" })
      .returning("*");

    // find the template and add a warmup exercise (no sets needed)
    await authed(token)
      .post(`/api/templates/${templateId}/exercises`)
      .send({ exerciseId: flex.id, section: "warmup" });

    const res = await authed(token)
      .post("/api/plans")
      .send({
        templateId,
        daysOfWeek: ["tuesday"],
        numWeeks: 3,
      });
    expect(res.status).toBe(201);
  });
});

// ─── GET /api/plans ───────────────────────────────────────────────────────────

describe("GET /api/plans", () => {
  it("returns empty array for user with no plans", async () => {
    const fresh = await registerAndLogin(`fresh${emailCounter}@example.com`);
    const res = await authed(fresh).get("/api/plans");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("returns the user's plans", async () => {
    await authed(token)
      .post("/api/plans")
      .send({
        templateId,
        daysOfWeek: ["monday"],
        numWeeks: 4,
      });
    const res = await authed(token).get("/api/plans");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].templateId).toBe(templateId);
  });

  it("does not return other users' plans", async () => {
    const other = await registerAndLogin(`other2${emailCounter}@example.com`);
    const otherId = await buildReadyTemplate(other);
    await authed(other)
      .post("/api/plans")
      .send({
        templateId: otherId,
        daysOfWeek: ["tuesday"],
        numWeeks: 2,
      });
    const res = await authed(token).get("/api/plans");
    expect(res.body).toHaveLength(0);
  });
});

// ─── GET /api/plans/:id ───────────────────────────────────────────────────────

describe("GET /api/plans/:id", () => {
  it("returns plan by id", async () => {
    const { body: plan } = await authed(token)
      .post("/api/plans")
      .send({
        templateId,
        daysOfWeek: ["monday", "friday"],
        numWeeks: 8,
      });
    const res = await authed(token).get(`/api/plans/${plan.id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(plan.id);
    expect(res.body.numWeeks).toBe(8);
    expect(res.body.daysOfWeek).toEqual(["monday", "friday"]);
  });

  it("returns 404 for unknown id", async () => {
    const res = await authed(token).get(
      "/api/plans/00000000-0000-0000-0000-000000000000",
    );
    expect(res.status).toBe(404);
  });

  it("returns 404 for another user's plan", async () => {
    const other = await registerAndLogin(`other3${emailCounter}@example.com`);
    const otherId = await buildReadyTemplate(other);
    const { body: plan } = await authed(other)
      .post("/api/plans")
      .send({
        templateId: otherId,
        daysOfWeek: ["tuesday"],
        numWeeks: 2,
      });
    const res = await authed(token).get(`/api/plans/${plan.id}`);
    expect(res.status).toBe(404);
  });
});

// ─── DELETE /api/plans/:id ────────────────────────────────────────────────────

describe("DELETE /api/plans/:id", () => {
  it("deletes plan and returns 204", async () => {
    const { body: plan } = await authed(token)
      .post("/api/plans")
      .send({
        templateId,
        daysOfWeek: ["monday"],
        numWeeks: 4,
      });
    const res = await authed(token).delete(`/api/plans/${plan.id}`);
    expect(res.status).toBe(204);
    const check = await authed(token).get(`/api/plans/${plan.id}`);
    expect(check.status).toBe(404);
  });

  it("returns 404 for unknown plan", async () => {
    const res = await authed(token).delete(
      "/api/plans/00000000-0000-0000-0000-000000000000",
    );
    expect(res.status).toBe(404);
  });

  it("returns 404 for another user's plan", async () => {
    const other = await registerAndLogin(`other4${emailCounter}@example.com`);
    const otherId = await buildReadyTemplate(other);
    const { body: plan } = await authed(other)
      .post("/api/plans")
      .send({
        templateId: otherId,
        daysOfWeek: ["tuesday"],
        numWeeks: 2,
      });
    const res = await authed(token).delete(`/api/plans/${plan.id}`);
    expect(res.status).toBe(404);
  });
});

// ─── PATCH /api/plans/:id ─────────────────────────────────────────────────────

describe("PATCH /api/plans/:id", () => {
  let planId: string;

  beforeEach(async () => {
    const { body: plan } = await authed(token)
      .post("/api/plans")
      .send({
        templateId,
        daysOfWeek: ["monday", "wednesday"],
        numWeeks: 4,
      });
    planId = plan.id;
  });

  it("updates daysOfWeek", async () => {
    const res = await authed(token)
      .patch(`/api/plans/${planId}`)
      .send({ daysOfWeek: ["tuesday", "thursday", "saturday"] });
    expect(res.status).toBe(200);
    expect(res.body.daysOfWeek).toEqual(["tuesday", "thursday", "saturday"]);
  });

  it("updates numWeeks", async () => {
    const res = await authed(token)
      .patch(`/api/plans/${planId}`)
      .send({ numWeeks: 8 });
    expect(res.status).toBe(200);
    expect(res.body.numWeeks).toBe(8);
  });

  it("returns 400 for empty daysOfWeek", async () => {
    const res = await authed(token)
      .patch(`/api/plans/${planId}`)
      .send({ daysOfWeek: [] });
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid day", async () => {
    const res = await authed(token)
      .patch(`/api/plans/${planId}`)
      .send({ daysOfWeek: ["funday"] });
    expect(res.status).toBe(400);
  });

  it("returns 404 for another user's plan", async () => {
    const other = await registerAndLogin(
      `patchother${emailCounter}@example.com`,
    );
    const res = await authed(other)
      .patch(`/api/plans/${planId}`)
      .send({ numWeeks: 2 });
    expect(res.status).toBe(404);
  });

  it("returns 404 for unknown plan", async () => {
    const res = await authed(token)
      .patch("/api/plans/00000000-0000-0000-0000-000000000000")
      .send({ numWeeks: 2 });
    expect(res.status).toBe(404);
  });
});
