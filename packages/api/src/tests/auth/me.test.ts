import { getCapturedToken } from "@infrastructure/email";
import { createApp } from "@presentation/app";
import supertest from "supertest";
import { describe, expect, it } from "vitest";

const app = createApp();

async function registerAndGetToken(
  email = "test@example.com",
  password = "password123",
) {
  const response = await supertest(app)
    .post("/auth/register")
    .send({ email, password });
  return response.body.accessToken as string;
}

describe("GET /auth/me", () => {
  it("returns the current user's id, email, and emailVerifiedAt", async () => {
    const token = await registerAndGetToken();

    const response = await supertest(app)
      .get("/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.email).toBe("test@example.com");
    expect(response.body.id).toBeDefined();
    expect(response.body.emailVerifiedAt).toBeNull();
    expect(response.body.isAdmin).toBe(false);
    expect(response.body).not.toHaveProperty("passwordHash");
  });

  it("reflects emailVerifiedAt after verification", async () => {
    const token = await registerAndGetToken();

    const verificationToken = getCapturedToken("test@example.com")!;
    await supertest(app).get(`/auth/verify?token=${verificationToken}`);

    const response = await supertest(app)
      .get("/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.emailVerifiedAt).not.toBeNull();
  });

  it("returns 401 without a token", async () => {
    const response = await supertest(app).get("/auth/me");
    expect(response.status).toBe(401);
  });

  it("returns 401 with an invalid token", async () => {
    const response = await supertest(app)
      .get("/auth/me")
      .set("Authorization", "Bearer not.a.valid.token");
    expect(response.status).toBe(401);
  });
});
