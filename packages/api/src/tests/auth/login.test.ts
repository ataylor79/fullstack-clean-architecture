import { createApp } from "@presentation/app";
import supertest from "supertest";
import { beforeEach, describe, expect, it } from "vitest";

const app = createApp();

async function registerUser(
  email = "test@example.com",
  password = "password123",
) {
  await supertest(app).post("/auth/register").send({ email, password });
}

describe("POST /auth/login", () => {
  beforeEach(async () => {
    await registerUser();
  });

  it("returns 200 with access token and sets httpOnly refresh cookie", async () => {
    const response = await supertest(app)
      .post("/auth/login")
      .send({ email: "test@example.com", password: "password123" });

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe("test@example.com");
    expect(response.body.user.id).toBeDefined();
    expect(response.body.user).not.toHaveProperty("passwordHash");
    expect(typeof response.body.accessToken).toBe("string");
    const cookies = response.headers["set-cookie"] as unknown as string[];
    expect(cookies).toBeDefined();
    expect(cookies.some((c) => c.startsWith("refreshToken="))).toBe(true);
    expect(cookies.some((c) => c.includes("HttpOnly"))).toBe(true);
  });

  it("returns 401 when password is wrong", async () => {
    const response = await supertest(app)
      .post("/auth/login")
      .send({ email: "test@example.com", password: "wrongpassword" });

    expect(response.status).toBe(401);
  });

  it("returns 401 when email does not exist", async () => {
    const response = await supertest(app)
      .post("/auth/login")
      .send({ email: "nobody@example.com", password: "password123" });

    expect(response.status).toBe(401);
  });

  it("returns 400 when email is missing", async () => {
    const response = await supertest(app)
      .post("/auth/login")
      .send({ password: "password123" });

    expect(response.status).toBe(400);
  });
});
