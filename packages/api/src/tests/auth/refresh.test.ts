import { createApp } from "@presentation/app";
import supertest from "supertest";
import { describe, expect, it } from "vitest";

const app = createApp();

async function registerAndGetCookie() {
  const response = await supertest(app)
    .post("/auth/register")
    .send({ email: "test@example.com", password: "password123" });
  const cookies = response.headers["set-cookie"] as unknown as string[];
  const refreshCookie = cookies.find((c) => c.startsWith("refreshToken="))!;
  return { refreshCookie, accessToken: response.body.accessToken as string };
}

describe("POST /auth/refresh", () => {
  it("returns a new access token and rotates the refresh cookie", async () => {
    const { refreshCookie, accessToken: oldAccessToken } =
      await registerAndGetCookie();

    const response = await supertest(app)
      .post("/auth/refresh")
      .set("Cookie", refreshCookie);

    expect(response.status).toBe(200);
    expect(typeof response.body.accessToken).toBe("string");
    expect(response.body.accessToken).not.toBe(oldAccessToken);

    const cookies = response.headers["set-cookie"] as unknown as string[];
    expect(cookies.some((c) => c.startsWith("refreshToken="))).toBe(true);
    expect(cookies.some((c) => c.includes("HttpOnly"))).toBe(true);
    expect(cookies.find((c) => c.startsWith("refreshToken="))).not.toBe(
      refreshCookie,
    );
  });

  it("returns 401 when no refresh cookie is present", async () => {
    const response = await supertest(app).post("/auth/refresh");
    expect(response.status).toBe(401);
  });

  it("returns 401 when refresh token has already been used (reuse detection)", async () => {
    const { refreshCookie } = await registerAndGetCookie();

    // Use the token once — valid rotation
    await supertest(app).post("/auth/refresh").set("Cookie", refreshCookie);

    // Reuse the same old token — should be rejected
    const response = await supertest(app)
      .post("/auth/refresh")
      .set("Cookie", refreshCookie);

    expect(response.status).toBe(401);
  });
});
