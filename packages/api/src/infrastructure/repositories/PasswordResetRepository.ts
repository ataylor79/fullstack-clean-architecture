import type { IPasswordResetRepository } from "@domain/repositories/IPasswordResetRepository";
import { db } from "@infrastructure/database/db";

type PasswordResetRow = {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
};

export function createPasswordResetRepository(): IPasswordResetRepository {
  return {
    async create(data) {
      await db("password_reset_tokens").insert({
        user_id: data.userId,
        token_hash: data.tokenHash,
        expires_at: data.expiresAt,
      });
    },

    async findByTokenHash(tokenHash) {
      const row = await db<PasswordResetRow>("password_reset_tokens")
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
      await db("password_reset_tokens").where({ user_id: userId }).delete();
    },

    async deleteByTokenHash(tokenHash) {
      await db("password_reset_tokens")
        .where({ token_hash: tokenHash })
        .delete();
    },
  };
}
