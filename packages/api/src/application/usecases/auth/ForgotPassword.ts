import crypto from "node:crypto";
import type { IPasswordResetRepository } from "@domain/repositories/IPasswordResetRepository";
import type { IUserRepository } from "@domain/repositories/IUserRepository";
import type { IEmailService } from "@domain/services/IEmailService";
import { hashToken } from "@infrastructure/auth/tokens";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

type Deps = {
  userRepo: IUserRepository;
  passwordResetRepo: IPasswordResetRepository;
  emailService: IEmailService;
};

export async function forgotPassword(deps: Deps, email: string) {
  const user = await deps.userRepo.findByEmail(email);

  // Silently succeed for unknown emails — avoid user enumeration
  if (!user) return;

  // Replace any existing reset token for this user
  await deps.passwordResetRepo.deleteByUserId(user.id);

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

  await deps.passwordResetRepo.create({ userId: user.id, tokenHash, expiresAt });
  await deps.emailService.sendPasswordResetEmail(email, rawToken);
}
