import { db } from "@infrastructure/database/db";
import { authed, registerAndLogin, registerAndLoginAsAdmin } from "tests/helpers/auth";
import supertest from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "@presentation/app";

let token: string;
let adminToken: string;
let emailCounter = 0;

const app = createApp();

beforeEach(async () => {
  emailCounter++;
  token = await registerAndLogin(`user${emailCounter}@example.com`);
  adminToken = await registerAndLoginAsAdmin(
    `admin${emailCounter}@example.com`,
  );
});

describe("GET /api/exercises", () => {
  it("returns an empty array when no exercises exist", async () => {
    const response = await authed(token).get("/api/exercises");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it("returns all exercises", async () => {
    await db("exercises").insert([
      { name: "Squat", muscle_group: "Legs" },
      { name: "Deadlift", muscle_group: "Back" },
    ]);

    const response = await authed(token).get("/api/exercises");

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
    expect(response.body[0].muscleGroup).toBeDefined();
  });

  it("returns 401 without auth", async () => {
    const response = await supertest(app).get("/api/exercises");
    expect(response.status).toBe(401);
  });
});

describe("GET /api/exercises/:id", () => {
  it("returns the exercise by id", async () => {
    const [row] = await db("exercises")
      .insert({ name: "Bench Press", muscle_group: "Chest" })
      .returning("*");

    const response = await authed(token).get(`/api/exercises/${row.id}`);

    expect(response.status).toBe(200);
    expect(response.body.name).toBe("Bench Press");
    expect(response.body.muscleGroup).toBe("Chest");
  });

  it("returns 404 for a non-existent exercise", async () => {
    const response = await authed(token).get(
      "/api/exercises/00000000-0000-0000-0000-000000000000",
    );
    expect(response.status).toBe(404);
  });
});

describe("POST /api/exercises", () => {
  it("creates an exercise and returns 201 for admin", async () => {
    const response = await authed(adminToken)
      .post("/api/exercises")
      .send({ name: "Pull-up", muscleGroup: "Back" });

    expect(response.status).toBe(201);
    expect(response.body.id).toBeDefined();
    expect(response.body.name).toBe("Pull-up");
    expect(response.body.muscleGroup).toBe("Back");
    expect(response.body.notes).toBeNull();
  });

  it("creates an exercise with optional notes", async () => {
    const response = await authed(adminToken)
      .post("/api/exercises")
      .send({ name: "Pull-up", muscleGroup: "Back", notes: "Use full ROM" });

    expect(response.status).toBe(201);
    expect(response.body.notes).toBe("Use full ROM");
  });

  it("returns 409 when exercise name already exists", async () => {
    await authed(adminToken)
      .post("/api/exercises")
      .send({ name: "Squat", muscleGroup: "Legs" });

    const response = await authed(adminToken)
      .post("/api/exercises")
      .send({ name: "Squat", muscleGroup: "Quads" });

    expect(response.status).toBe(409);
  });

  it("returns 403 for non-admin user", async () => {
    const response = await authed(token)
      .post("/api/exercises")
      .send({ name: "Pull-up", muscleGroup: "Back" });

    expect(response.status).toBe(403);
  });

  it("returns 400 when name is missing", async () => {
    const response = await authed(adminToken)
      .post("/api/exercises")
      .send({ muscleGroup: "Back" });

    expect(response.status).toBe(400);
  });

  it("returns 400 when muscleGroup is missing", async () => {
    const response = await authed(adminToken)
      .post("/api/exercises")
      .send({ name: "Pull-up" });

    expect(response.status).toBe(400);
  });

  it("returns 401 without auth", async () => {
    const response = await supertest(app)
      .post("/api/exercises")
      .send({ name: "Pull-up", muscleGroup: "Back" });

    expect(response.status).toBe(401);
  });
});

describe("PATCH /api/exercises/:id", () => {
  it("updates an exercise and returns the updated exercise for admin", async () => {
    const created = await authed(adminToken)
      .post("/api/exercises")
      .send({ name: "Row", muscleGroup: "Back" });

    const response = await authed(adminToken)
      .patch(`/api/exercises/${created.body.id}`)
      .send({ name: "Barbell Row" });

    expect(response.status).toBe(200);
    expect(response.body.name).toBe("Barbell Row");
    expect(response.body.muscleGroup).toBe("Back");
  });

  it("returns 409 when renaming to an existing exercise name", async () => {
    await authed(adminToken)
      .post("/api/exercises")
      .send({ name: "Squat", muscleGroup: "Legs" });
    const second = await authed(adminToken)
      .post("/api/exercises")
      .send({ name: "Lunge", muscleGroup: "Legs" });

    const response = await authed(adminToken)
      .patch(`/api/exercises/${second.body.id}`)
      .send({ name: "Squat" });

    expect(response.status).toBe(409);
  });

  it("returns 403 for non-admin user", async () => {
    const [row] = await db("exercises")
      .insert({ name: "Press", muscle_group: "Chest" })
      .returning("*");

    const response = await authed(token)
      .patch(`/api/exercises/${row.id}`)
      .send({ name: "Bench Press" });

    expect(response.status).toBe(403);
  });

  it("returns 404 for a non-existent exercise", async () => {
    const response = await authed(adminToken)
      .patch("/api/exercises/00000000-0000-0000-0000-000000000000")
      .send({ name: "Updated" });

    expect(response.status).toBe(404);
  });

  it("returns 400 when body is empty", async () => {
    const created = await authed(adminToken)
      .post("/api/exercises")
      .send({ name: "Row", muscleGroup: "Back" });

    const response = await authed(adminToken)
      .patch(`/api/exercises/${created.body.id}`)
      .send({});

    expect(response.status).toBe(400);
  });
});

describe("DELETE /api/exercises/:id", () => {
  it("deletes an exercise and returns 204 for admin", async () => {
    const created = await authed(adminToken)
      .post("/api/exercises")
      .send({ name: "Lunge", muscleGroup: "Legs" });

    const response = await authed(adminToken).delete(
      `/api/exercises/${created.body.id}`,
    );

    expect(response.status).toBe(204);
  });

  it("returns 403 for non-admin user", async () => {
    const [row] = await db("exercises")
      .insert({ name: "Curl", muscle_group: "Biceps" })
      .returning("*");

    const response = await authed(token).delete(`/api/exercises/${row.id}`);

    expect(response.status).toBe(403);
  });

  it("returns 404 for a non-existent exercise", async () => {
    const response = await authed(adminToken).delete(
      "/api/exercises/00000000-0000-0000-0000-000000000000",
    );
    expect(response.status).toBe(404);
  });
});
