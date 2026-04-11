import type { IEmailVerificationRepository } from "@domain/repositories/IEmailVerificationRepository";
import { db } from "@infrastructure/database/db";

type EmailVerificationRow = {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
};

export function createEmailVerificationRepository(): IEmailVerificationRepository {
  return {
    async create(data) {
      await db("email_verifications").insert({
        user_id: data.userId,
        token_hash: data.tokenHash,
        expires_at: data.expiresAt,
      });
    },

    async findByTokenHash(tokenHash) {
      const row = await db<EmailVerificationRow>("email_verifications")
        .where({ token_hash: tokenHash })
        .first();
      if (!row) return null;
      return {
        id: row.id,
        userId: row.user_id,
        tokenHash: row.token_hash,
        expiresAt: row.expires_at,
      };
    },

    async deleteByUserId(userId) {
      await db("email_verifications").where({ user_id: userId }).delete();
    },

    async deleteByTokenHash(tokenHash) {
      await db("email_verifications").where({ token_hash: tokenHash }).delete();
    },
  };
}
