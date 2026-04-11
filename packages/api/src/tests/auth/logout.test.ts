import { describe, it, expect } from "vitest";
import supertest from "supertest";
import { createApp } from "../../presentation/app";

const app = createApp();

async function registerAndGetCookie() {
  const response = await supertest(app)
    .post("/auth/register")
    .send({ email: "test@example.com", password: "password123" });
  const cookies = response.headers["set-cookie"] as unknown as string[];
  return cookies.find((c) => c.startsWith("refreshToken="))!;
}

describe("POST /auth/logout", () => {
  it("returns 204 and clears the refresh cookie", async () => {
    const refreshCookie = await registerAndGetCookie();

    const response = await supertest(app)
      .post("/auth/logout")
      .set("Cookie", refreshCookie);

    expect(response.status).toBe(204);
    const cookies = (response.headers["set-cookie"] as unknown as string[]) ?? [];
    const cleared = cookies.find((c) => c.startsWith("refreshToken="));
    expect(cleared).toContain("Expires=Thu, 01 Jan 1970");
  });

  it("invalidates the refresh token so it cannot be used after logout", async () => {
    const refreshCookie = await registerAndGetCookie();

    await supertest(app).post("/auth/logout").set("Cookie", refreshCookie);

    const response = await supertest(app)
      .post("/auth/refresh")
      .set("Cookie", refreshCookie);

    expect(response.status).toBe(401);
  });

  it("returns 204 even when no refresh cookie is present", async () => {
    const response = await supertest(app).post("/auth/logout");
    expect(response.status).toBe(204);
  });
});
