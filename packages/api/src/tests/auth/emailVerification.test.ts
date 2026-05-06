import { db } from "@infrastructure/database/db";
import { getCapturedToken } from "@infrastructure/email";
import { createApp } from "@presentation/app";
import supertest from "supertest";
import { describe, expect, it } from "vitest";

const app = createApp();

async function register(email = "test@example.com", password = "password123") {
  const response = await supertest(app)
    .post("/auth/register")
    .send({ email, password });
  return {
    accessToken: response.body.accessToken as string,
    cookies: response.headers["set-cookie"] as unknown as string[],
  };
}

describe("GET /auth/verify", () => {
  it("marks the user as verified and returns 200", async () => {
    await register("test@example.com");
    const token = getCapturedToken("test@example.com")!;

    const response = await supertest(app).get(`/auth/verify?token=${token}`);

    expect(response.status).toBe(200);

    const user = await db("users").where({ email: "test@example.com" }).first();
    expect(user.email_verified_at).not.toBeNull();
  });

  it("returns 400 when token is invalid", async () => {
    const response = await supertest(app).get(
      "/auth/verify?token=not-a-real-token",
    );
    expect(response.status).toBe(400);
  });

  it("returns 400 when token is missing", async () => {
    const response = await supertest(app).get("/auth/verify");
    expect(response.status).toBe(400);
  });

  it("returns 400 when token has already been used", async () => {
    await register("test@example.com");
    const token = getCapturedToken("test@example.com")!;

    await supertest(app).get(`/auth/verify?token=${token}`);
    const response = await supertest(app).get(`/auth/verify?token=${token}`);

    expect(response.status).toBe(400);
  });
});

describe("POST /auth/resend-verification", () => {
  it("creates a new verification token and returns 204", async () => {
    const { accessToken } = await register("test@example.com");
    const oldToken = getCapturedToken("test@example.com")!;

    const response = await supertest(app)
      .post("/auth/resend-verification")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(204);

    const newToken = getCapturedToken("test@example.com")!;
    expect(newToken).not.toBe(oldToken);
  });

  it("returns 401 when not authenticated", async () => {
    const response = await supertest(app).post("/auth/resend-verification");
    expect(response.status).toBe(401);
  });

  it("returns 400 when email is already verified", async () => {
    const { accessToken } = await register("test@example.com");
    const token = getCapturedToken("test@example.com")!;
    await supertest(app).get(`/auth/verify?token=${token}`);

    const response = await supertest(app)
      .post("/auth/resend-verification")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(400);
  });
});

describe("email verification gate on POST /api/workouts", () => {
  it("returns 403 when user email is not verified", async () => {
    const { accessToken } = await register("test@example.com");

    const response = await supertest(app)
      .post("/api/workouts")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Morning Run",
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
      });

    expect(response.status).toBe(403);
  });

  it("allows workout creation after email is verified", async () => {
    const { accessToken } = await register("test@example.com");
    const token = getCapturedToken("test@example.com")!;
    await supertest(app).get(`/auth/verify?token=${token}`);

    const [exercise] = await db("exercises")
      .insert({ name: "Jogging", exercise_category: "cardio" })
      .returning("*");

    const response = await supertest(app)
      .post("/api/workouts")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Morning Run",
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
        durationMinutes: 30,
        difficulty: "beginner",
        type: "cardio",
        exercises: [exercise.id],
      });

    expect(response.status).toBe(201);
  });
});
