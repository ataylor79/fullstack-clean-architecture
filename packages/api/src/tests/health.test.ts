import { describe, it, expect } from "vitest";
import supertest from "supertest";
import { createApp } from "../presentation/app";

describe("GET /health", () => {
  it("returns 200 with status ok", async () => {
    const app = createApp();
    const response = await supertest(app).get("/health");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });
});
