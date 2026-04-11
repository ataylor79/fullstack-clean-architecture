import { createApp } from "@presentation/app";
import supertest from "supertest";
import { describe, expect, it } from "vitest";

describe("GET /health", () => {
  it("returns 200 with status ok", async () => {
    const app = createApp();
    const response = await supertest(app).get("/health");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });
});
