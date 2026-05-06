import { db } from "@infrastructure/database/db";
import { getCapturedToken } from "@infrastructure/email";
import { createApp } from "@presentation/app";
import supertest from "supertest";

const app = createApp();

export async function registerAndLogin(
  email: string,
  password = "password123",
) {
  const response = await supertest(app)
    .post("/auth/register")
    .send({ email, password });
  const accessToken = response.body.accessToken as string;

  const verificationToken = getCapturedToken(email)!;
  await supertest(app).get(`/auth/verify?token=${verificationToken}`);

  return accessToken;
}

export async function registerAndLoginAsAdmin(
  email: string,
  password = "password123",
) {
  const accessToken = await registerAndLogin(email, password);
  await db("users").where({ email }).update({ is_admin: true });
  return accessToken;
}

export function authed(token: string) {
  const auth = { Authorization: `Bearer ${token}` };
  return {
    get: (url: string) => supertest(app).get(url).set(auth),
    post: (url: string) => supertest(app).post(url).set(auth),
    patch: (url: string) => supertest(app).patch(url).set(auth),
    delete: (url: string) => supertest(app).delete(url).set(auth),
  };
}
