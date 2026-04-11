import type { User } from "@domain/entities/User";

export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(data: { email: string; passwordHash: string }): Promise<User>;
  markEmailVerified(id: string): Promise<void>;
  updatePassword(id: string, passwordHash: string): Promise<void>;
}
