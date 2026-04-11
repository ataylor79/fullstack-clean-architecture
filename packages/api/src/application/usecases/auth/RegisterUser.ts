import type { IEmailVerificationRepository } from "@domain/repositories/IEmailVerificationRepository";
import type { IRefreshTokenRepository } from "@domain/repositories/IRefreshTokenRepository";
import type { IUserRepository } from "@domain/repositories/IUserRepository";
import type { IEmailService } from "@domain/services/IEmailService";
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  REFRESH_TOKEN_TTL_MS,
} from "@infrastructure/auth/tokens";
import { ConflictError } from "@presentation/errors";
import argon2 from "argon2";
import { sendVerificationEmail } from "./SendVerificationEmail";

type Deps = {
  userRepo: IUserRepository;
  refreshTokenRepo: IRefreshTokenRepository;
  emailVerificationRepo: IEmailVerificationRepository;
  emailService: IEmailService;
};

export async function registerUser(
  deps: Deps,
  email: string,
  password: string,
) {
  const existing = await deps.userRepo.findByEmail(email);
  if (existing) {
    throw new ConflictError("Email already registered");
  }

  const passwordHash = await argon2.hash(password);
  const user = await deps.userRepo.create({ email, passwordHash });

  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken();
  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

  await deps.refreshTokenRepo.create({ userId: user.id, tokenHash, expiresAt });

  await sendVerificationEmail(
    {
      emailVerificationRepo: deps.emailVerificationRepo,
      emailService: deps.emailService,
    },
    user.id,
    user.email,
  );

  return {
    user: { id: user.id, email: user.email },
    accessToken,
    refreshToken,
  };
}
