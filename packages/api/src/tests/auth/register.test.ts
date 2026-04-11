import { createApp } from "@presentation/app";
import supertest from "supertest";
import { describe, expect, it } from "vitest";

const app = createApp();

describe("POST /auth/register", () => {
  it("returns 201 with access token and sets httpOnly refresh cookie", async () => {
    const response = await supertest(app)
      .post("/auth/register")
      .send({ email: "test@example.com", password: "password123" });

    expect(response.status).toBe(201);
    expect(response.body.user.email).toBe("test@example.com");
    expect(response.body.user.id).toBeDefined();
    expect(response.body.user).not.toHaveProperty("passwordHash");
    expect(typeof response.body.accessToken).toBe("string");
    const cookies = response.headers["set-cookie"] as unknown as string[];
    expect(cookies).toBeDefined();
    expect(cookies.some((c) => c.startsWith("refreshToken="))).toBe(true);
    expect(cookies.some((c) => c.includes("HttpOnly"))).toBe(true);
  });

  it("returns 409 when email is already registered", async () => {
    await supertest(app)
      .post("/auth/register")
      .send({ email: "dupe@example.com", password: "password123" });

    const response = await supertest(app)
      .post("/auth/register")
      .send({ email: "dupe@example.com", password: "password123" });

    expect(response.status).toBe(409);
  });

  it("returns 400 when email is invalid", async () => {
    const response = await supertest(app)
      .post("/auth/register")
      .send({ email: "not-an-email", password: "password123" });

    expect(response.status).toBe(400);
  });

  it("returns 400 when password is shorter than 8 characters", async () => {
    const response = await supertest(app)
      .post("/auth/register")
      .send({ email: "test@example.com", password: "short" });

    expect(response.status).toBe(400);
  });
});
