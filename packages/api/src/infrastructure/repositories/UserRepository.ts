import type { User } from "@domain/entities/User";
import type { IUserRepository } from "@domain/repositories/IUserRepository";
import { db } from "@infrastructure/database/db";

type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  email_verified_at: Date | null;
  is_admin: boolean;
  created_at: Date;
  updated_at: Date;
};

function toUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    emailVerifiedAt: row.email_verified_at,
    isAdmin: row.is_admin,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createUserRepository(): IUserRepository {
  return {
    async findByEmail(email) {
      const row = await db<UserRow>("users").where({ email }).first();
      return row ? toUser(row) : null;
    },

    async findById(id) {
      const row = await db<UserRow>("users").where({ id }).first();
      return row ? toUser(row) : null;
    },

    async create(data) {
      const [row] = await db<UserRow>("users")
        .insert({ email: data.email, password_hash: data.passwordHash })
        .returning("*");
      return toUser(row);
    },

    async markEmailVerified(id) {
      await db("users")
        .where({ id })
        .update({ email_verified_at: new Date(), updated_at: new Date() });
    },

    async updatePassword(id, passwordHash) {
      await db("users")
        .where({ id })
        .update({ password_hash: passwordHash, updated_at: new Date() });
    },
  };
}
