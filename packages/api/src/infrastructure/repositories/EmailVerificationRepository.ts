import { db } from "../database/db";
import type { IEmailVerificationRepository } from "../../domain/repositories/IEmailVerificationRepository";

type EmailVerificationRow = {
  id: string;
  user_id: string;
  token: string;
  expires_at: Date;
};

export function createEmailVerificationRepository(): IEmailVerificationRepository {
  return {
    async create(data) {
      await db("email_verifications").insert({
        user_id: data.userId,
        token: data.token,
        expires_at: data.expiresAt,
      });
    },

    async findByToken(token) {
      const row = await db<EmailVerificationRow>("email_verifications")
        .where({ token })
        .first();
      if (!row) return null;
      return {
        id: row.id,
        userId: row.user_id,
        token: row.token,
        expiresAt: row.expires_at,
      };
    },

    async deleteByUserId(userId) {
      await db("email_verifications").where({ user_id: userId }).delete();
    },

    async deleteByToken(token) {
      await db("email_verifications").where({ token }).delete();
    },
  };
}
