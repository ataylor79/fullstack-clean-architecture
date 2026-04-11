import { getCapturedResetToken } from "@infrastructure/email";
import { createApp } from "@presentation/app";
import supertest from "supertest";
import { describe, expect, it } from "vitest";

const app = createApp();

async function register(email: string, password = "password123") {
  await supertest(app).post("/auth/register").send({ email, password });
}

describe("POST /auth/forgot-password", () => {
  it("returns 204 for a registered email", async () => {
    await register("user@example.com");

    const response = await supertest(app)
      .post("/auth/forgot-password")
      .send({ email: "user@example.com" });

    expect(response.status).toBe(204);
  });

  it("returns 204 for an unknown email (no user enumeration)", async () => {
    const response = await supertest(app)
      .post("/auth/forgot-password")
      .send({ email: "nobody@example.com" });

    expect(response.status).toBe(204);
  });

  it("returns 400 when email is missing", async () => {
    const response = await supertest(app)
      .post("/auth/forgot-password")
      .send({});

    expect(response.status).toBe(400);
  });
});

describe("POST /auth/reset-password", () => {
  it("resets password and returns 204", async () => {
    await register("user@example.com");
    await supertest(app)
      .post("/auth/forgot-password")
      .send({ email: "user@example.com" });

    const token = getCapturedResetToken("user@example.com")!;
    const response = await supertest(app)
      .post("/auth/reset-password")
      .send({ token, password: "newpassword123" });

    expect(response.status).toBe(204);
  });

  it("allows login with the new password after reset", async () => {
    await register("user@example.com");
    await supertest(app)
      .post("/auth/forgot-password")
      .send({ email: "user@example.com" });

    const token = getCapturedResetToken("user@example.com")!;
    await supertest(app)
      .post("/auth/reset-password")
      .send({ token, password: "newpassword123" });

    const loginRes = await supertest(app)
      .post("/auth/login")
      .send({ email: "user@example.com", password: "newpassword123" });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.accessToken).toBeDefined();
  });

  it("rejects login with the old password after reset", async () => {
    await register("user@example.com");
    await supertest(app)
      .post("/auth/forgot-password")
      .send({ email: "user@example.com" });

    const token = getCapturedResetToken("user@example.com")!;
    await supertest(app)
      .post("/auth/reset-password")
      .send({ token, password: "newpassword123" });

    const loginRes = await supertest(app)
      .post("/auth/login")
      .send({ email: "user@example.com", password: "password123" });

    expect(loginRes.status).toBe(401);
  });

  it("returns 400 for an invalid token", async () => {
    const response = await supertest(app)
      .post("/auth/reset-password")
      .send({ token: "not-a-real-token", password: "newpassword123" });

    expect(response.status).toBe(400);
  });

  it("returns 400 when token is already used", async () => {
    await register("user@example.com");
    await supertest(app)
      .post("/auth/forgot-password")
      .send({ email: "user@example.com" });

    const token = getCapturedResetToken("user@example.com")!;
    await supertest(app)
      .post("/auth/reset-password")
      .send({ token, password: "newpassword123" });

    const response = await supertest(app)
      .post("/auth/reset-password")
      .send({ token, password: "anotherpassword123" });

    expect(response.status).toBe(400);
  });

  it("returns 400 when password is too short", async () => {
    await register("user@example.com");
    await supertest(app)
      .post("/auth/forgot-password")
      .send({ email: "user@example.com" });

    const token = getCapturedResetToken("user@example.com")!;
    const response = await supertest(app)
      .post("/auth/reset-password")
      .send({ token, password: "short" });

    expect(response.status).toBe(400);
  });

  it("returns 400 when token is missing", async () => {
    const response = await supertest(app)
      .post("/auth/reset-password")
      .send({ password: "newpassword123" });

    expect(response.status).toBe(400);
  });
});
