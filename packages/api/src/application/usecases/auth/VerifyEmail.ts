import type { IUserRepository } from "../../../domain/repositories/IUserRepository";
import type { IEmailVerificationRepository } from "../../../domain/repositories/IEmailVerificationRepository";
import { ValidationError } from "../../../presentation/errors";

type Deps = {
  userRepo: IUserRepository;
  emailVerificationRepo: IEmailVerificationRepository;
};

export async function verifyEmail(deps: Deps, token: string) {
  const record = await deps.emailVerificationRepo.findByToken(token);

  if (!record) {
    throw new ValidationError("Invalid or expired verification token");
  }

  if (record.expiresAt < new Date()) {
    await deps.emailVerificationRepo.deleteByToken(token);
    throw new ValidationError("Invalid or expired verification token");
  }

  await deps.userRepo.markEmailVerified(record.userId);
  await deps.emailVerificationRepo.deleteByToken(token);
}
