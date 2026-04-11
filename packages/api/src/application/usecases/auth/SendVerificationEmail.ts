import crypto from "node:crypto";
import type { IEmailVerificationRepository } from "@domain/repositories/IEmailVerificationRepository";
import type { IEmailService } from "@domain/services/IEmailService";
import { hashToken } from "@infrastructure/auth/tokens";

const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

type Deps = {
  emailVerificationRepo: IEmailVerificationRepository;
  emailService: IEmailService;
};

export async function sendVerificationEmail(
  deps: Deps,
  userId: string,
  email: string,
) {
  // Replace any existing token for this user
  await deps.emailVerificationRepo.deleteByUserId(userId);

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS);

  await deps.emailVerificationRepo.create({ userId, tokenHash, expiresAt });
  await deps.emailService.sendVerificationEmail(email, rawToken);
}
