import { describe, it, expect } from "vitest";
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

const futureDate = new Date(Date.now() + 86400000).toISOString();

describe("GET /api/workouts", () => {
  it("returns only the authenticated user's workouts", async () => {
    const tokenA = await registerAndLogin("a@example.com");
    const tokenB = await registerAndLogin("b@example.com");

    await authed(tokenA).post("/api/workouts").send({
      name: "User A Workout",
      scheduledAt: futureDate,
    });
    await authed(tokenB).post("/api/workouts").send({
      name: "User B Workout",
      scheduledAt: futureDate,
    });

    const response = await authed(tokenA).get("/api/workouts");

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].name).toBe("User A Workout");
  });
});

describe("POST /api/workouts", () => {
  it("creates a workout and returns 201 with the workout", async () => {
    const token = await registerAndLogin("user@example.com");

    const response = await authed(token).post("/api/workouts").send({
      name: "Morning Session",
      scheduledAt: futureDate,
    });

    expect(response.status).toBe(201);
    expect(response.body.name).toBe("Morning Session");
    expect(response.body.id).toBeDefined();
    expect(response.body.completedAt).toBeNull();
  });

  it("returns 400 when name is missing", async () => {
    const token = await registerAndLogin("user@example.com");

    const response = await authed(token)
      .post("/api/workouts")
      .send({ scheduledAt: futureDate });

    expect(response.status).toBe(400);
  });

  it("returns 400 when scheduledAt is missing", async () => {
    const token = await registerAndLogin("user@example.com");

    const response = await authed(token)
      .post("/api/workouts")
      .send({ name: "Morning Session" });

    expect(response.status).toBe(400);
  });
});

describe("GET /api/workouts/:id", () => {
  it("returns the workout for its owner", async () => {
    const token = await registerAndLogin("user@example.com");
    const created = await authed(token)
      .post("/api/workouts")
      .send({ name: "Leg Day", scheduledAt: futureDate });

    const response = await authed(token).get(
      `/api/workouts/${created.body.id}`
    );

    expect(response.status).toBe(200);
    expect(response.body.name).toBe("Leg Day");
  });

  it("returns 404 when workout belongs to another user", async () => {
    const tokenA = await registerAndLogin("a@example.com");
    const tokenB = await registerAndLogin("b@example.com");

    const created = await authed(tokenA)
      .post("/api/workouts")
      .send({ name: "Private Workout", scheduledAt: futureDate });

    const response = await authed(tokenB).get(
      `/api/workouts/${created.body.id}`
    );

    expect(response.status).toBe(404);
  });

  it("returns 404 for a non-existent workout", async () => {
    const token = await registerAndLogin("user@example.com");
    const response = await authed(token).get(
      "/api/workouts/00000000-0000-0000-0000-000000000000"
    );
    expect(response.status).toBe(404);
  });
});

describe("PATCH /api/workouts/:id", () => {
  it("updates the workout for its owner", async () => {
    const token = await registerAndLogin("user@example.com");
    const created = await authed(token)
      .post("/api/workouts")
      .send({ name: "Old Name", scheduledAt: futureDate });

    const response = await authed(token)
      .patch(`/api/workouts/${created.body.id}`)
      .send({ name: "New Name" });

    expect(response.status).toBe(200);
    expect(response.body.name).toBe("New Name");
  });

  it("returns 404 when workout belongs to another user", async () => {
    const tokenA = await registerAndLogin("a@example.com");
    const tokenB = await registerAndLogin("b@example.com");

    const created = await authed(tokenA)
      .post("/api/workouts")
      .send({ name: "My Workout", scheduledAt: futureDate });

    const response = await authed(tokenB)
      .patch(`/api/workouts/${created.body.id}`)
      .send({ name: "Hijacked" });

    expect(response.status).toBe(404);
  });
});

describe("DELETE /api/workouts/:id", () => {
  it("deletes the workout for its owner and returns 204", async () => {
    const token = await registerAndLogin("user@example.com");
    const created = await authed(token)
      .post("/api/workouts")
      .send({ name: "To Delete", scheduledAt: futureDate });

    const response = await authed(token).delete(
      `/api/workouts/${created.body.id}`
    );

    expect(response.status).toBe(204);
  });

  it("returns 404 when workout belongs to another user", async () => {
    const tokenA = await registerAndLogin("a@example.com");
    const tokenB = await registerAndLogin("b@example.com");

    const created = await authed(tokenA)
      .post("/api/workouts")
      .send({ name: "My Workout", scheduledAt: futureDate });

    const response = await authed(tokenB).delete(
      `/api/workouts/${created.body.id}`
    );

    expect(response.status).toBe(404);
  });
});
