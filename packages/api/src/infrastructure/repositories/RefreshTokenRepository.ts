import { db } from "../database/db";
import type { IRefreshTokenRepository } from "../../domain/repositories/IRefreshTokenRepository";

type RefreshTokenRow = {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
};

export function createRefreshTokenRepository(): IRefreshTokenRepository {
  return {
    async create(data) {
      await db("refresh_tokens").insert({
        user_id: data.userId,
        token_hash: data.tokenHash,
        expires_at: data.expiresAt,
      });
    },

    async findByTokenHash(tokenHash) {
      const row = await db<RefreshTokenRow>("refresh_tokens")
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

    async deleteByTokenHash(tokenHash) {
      await db("refresh_tokens").where({ token_hash: tokenHash }).delete();
    },

    async deleteAllForUser(userId) {
      await db("refresh_tokens").where({ user_id: userId }).delete();
    },
  };
}
