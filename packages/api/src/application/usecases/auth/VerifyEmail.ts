import type { IEmailVerificationRepository } from "@domain/repositories/IEmailVerificationRepository";
import type { IUserRepository } from "@domain/repositories/IUserRepository";
import { hashToken } from "@infrastructure/auth/tokens";
import { ValidationError } from "@presentation/errors";

type Deps = {
  userRepo: IUserRepository;
  emailVerificationRepo: IEmailVerificationRepository;
};

export async function verifyEmail(deps: Deps, rawToken: string) {
  const tokenHash = hashToken(rawToken);
  const record = await deps.emailVerificationRepo.findByTokenHash(tokenHash);

  if (!record) {
    throw new ValidationError("Invalid or expired verification token");
  }

  if (record.expiresAt < new Date()) {
    await deps.emailVerificationRepo.deleteByTokenHash(tokenHash);
    throw new ValidationError("Invalid or expired verification token");
  }

  await deps.userRepo.markEmailVerified(record.userId);
  await deps.emailVerificationRepo.deleteByTokenHash(tokenHash);
}
