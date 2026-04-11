import { describe, it, expect } from "vitest";
import supertest from "supertest";
import { createApp } from "../../presentation/app";

const app = createApp();

async function getAccessToken() {
  const response = await supertest(app)
    .post("/auth/register")
    .send({ email: "test@example.com", password: "password123" });
  return response.body.accessToken as string;
}

describe("authenticate middleware", () => {
  it("allows requests with a valid Bearer token", async () => {
    const accessToken = await getAccessToken();

    const response = await supertest(app)
      .get("/api/workouts")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
  });

  it("returns 401 when Authorization header is missing", async () => {
    const response = await supertest(app).get("/api/workouts");
    expect(response.status).toBe(401);
  });

  it("returns 401 when token is malformed", async () => {
    const response = await supertest(app)
      .get("/api/workouts")
      .set("Authorization", "Bearer not-a-valid-jwt");
    expect(response.status).toBe(401);
  });

  it("returns 401 when Bearer scheme is missing", async () => {
    const accessToken = await getAccessToken();

    const response = await supertest(app)
      .get("/api/workouts")
      .set("Authorization", accessToken);

    expect(response.status).toBe(401);
  });
});
