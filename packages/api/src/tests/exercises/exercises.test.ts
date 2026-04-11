import { describe, it, expect, beforeEach } from "vitest";
import supertest from "supertest";
import { createApp } from "../../presentation/app";
import { db } from "../../infrastructure/database/db";

const app = createApp();

async function registerAndLogin(email: string, password = "password123") {
  const response = await supertest(app)
    .post("/auth/register")
    .send({ email, password });
  const accessToken = response.body.accessToken as string;

  const row = await db("email_verifications")
    .join("users", "users.id", "email_verifications.user_id")
    .where("users.email", email)
    .select("email_verifications.token")
    .first();
  await supertest(app).get(`/auth/verify?token=${row.token}`);

  return accessToken;
}

function authed(token: string) {
  const auth = { Authorization: `Bearer ${token}` };
  return {
    get: (url: string) => supertest(app).get(url).set(auth),
    post: (url: string) => supertest(app).post(url).set(auth),
    patch: (url: string) => supertest(app).patch(url).set(auth),
    delete: (url: string) => supertest(app).delete(url).set(auth),
  };
}

let token: string;
let emailCounter = 0;

beforeEach(async () => {
  emailCounter++;
  token = await registerAndLogin(`user${emailCounter}@example.com`);
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
      "/api/exercises/00000000-0000-0000-0000-000000000000"
    );
    expect(response.status).toBe(404);
  });
});

describe("POST /api/exercises", () => {
  it("creates an exercise and returns 201", async () => {
    const response = await authed(token)
      .post("/api/exercises")
      .send({ name: "Pull-up", muscleGroup: "Back" });

    expect(response.status).toBe(201);
    expect(response.body.id).toBeDefined();
    expect(response.body.name).toBe("Pull-up");
    expect(response.body.muscleGroup).toBe("Back");
    expect(response.body.notes).toBeNull();
  });

  it("creates an exercise with optional notes", async () => {
    const response = await authed(token)
      .post("/api/exercises")
      .send({ name: "Pull-up", muscleGroup: "Back", notes: "Use full ROM" });

    expect(response.status).toBe(201);
    expect(response.body.notes).toBe("Use full ROM");
  });

  it("returns 400 when name is missing", async () => {
    const response = await authed(token)
      .post("/api/exercises")
      .send({ muscleGroup: "Back" });

    expect(response.status).toBe(400);
  });

  it("returns 400 when muscleGroup is missing", async () => {
    const response = await authed(token)
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
  it("updates an exercise and returns the updated exercise", async () => {
    const created = await authed(token)
      .post("/api/exercises")
      .send({ name: "Row", muscleGroup: "Back" });

    const response = await authed(token)
      .patch(`/api/exercises/${created.body.id}`)
      .send({ name: "Barbell Row" });

    expect(response.status).toBe(200);
    expect(response.body.name).toBe("Barbell Row");
    expect(response.body.muscleGroup).toBe("Back");
  });

  it("returns 404 for a non-existent exercise", async () => {
    const response = await authed(token)
      .patch("/api/exercises/00000000-0000-0000-0000-000000000000")
      .send({ name: "Updated" });

    expect(response.status).toBe(404);
  });

  it("returns 400 when body is empty", async () => {
    const created = await authed(token)
      .post("/api/exercises")
      .send({ name: "Row", muscleGroup: "Back" });

    const response = await authed(token)
      .patch(`/api/exercises/${created.body.id}`)
      .send({});

    expect(response.status).toBe(400);
  });
});

describe("DELETE /api/exercises/:id", () => {
  it("deletes an exercise and returns 204", async () => {
    const created = await authed(token)
      .post("/api/exercises")
      .send({ name: "Lunge", muscleGroup: "Legs" });

    const response = await authed(token).delete(
      `/api/exercises/${created.body.id}`
    );

    expect(response.status).toBe(204);
  });

  it("returns 404 for a non-existent exercise", async () => {
    const response = await authed(token).delete(
      "/api/exercises/00000000-0000-0000-0000-000000000000"
    );
    expect(response.status).toBe(404);
  });
});
