import crypto from "crypto";
import type { IEmailVerificationRepository } from "../../../domain/repositories/IEmailVerificationRepository";
import type { IEmailService } from "../../../domain/services/IEmailService";

const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

type Deps = {
  emailVerificationRepo: IEmailVerificationRepository;
  emailService: IEmailService;
};

export async function sendVerificationEmail(
  deps: Deps,
  userId: string,
  email: string
) {
  // Replace any existing token for this user
  await deps.emailVerificationRepo.deleteByUserId(userId);

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS);

  await deps.emailVerificationRepo.create({ userId, token, expiresAt });
  await deps.emailService.sendVerificationEmail(email, token);
}
