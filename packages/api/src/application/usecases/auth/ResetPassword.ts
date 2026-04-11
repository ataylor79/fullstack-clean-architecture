import argon2 from "argon2";
import type { IPasswordResetRepository } from "@domain/repositories/IPasswordResetRepository";
import type { IUserRepository } from "@domain/repositories/IUserRepository";
import { ValidationError } from "@presentation/errors";
import { hashToken } from "@infrastructure/auth/tokens";

type Deps = {
  userRepo: IUserRepository;
  passwordResetRepo: IPasswordResetRepository;
};

export async function resetPassword(
  deps: Deps,
  rawToken: string,
  newPassword: string,
) {
  const tokenHash = hashToken(rawToken);
  const record = await deps.passwordResetRepo.findByTokenHash(tokenHash);

  if (!record) {
    throw new ValidationError("Invalid or expired reset token");
  }

  if (record.expiresAt < new Date()) {
    await deps.passwordResetRepo.deleteByTokenHash(tokenHash);
    throw new ValidationError("Invalid or expired reset token");
  }

  const passwordHash = await argon2.hash(newPassword);
  await deps.userRepo.updatePassword(record.userId, passwordHash);
  await deps.passwordResetRepo.deleteByTokenHash(tokenHash);
}
