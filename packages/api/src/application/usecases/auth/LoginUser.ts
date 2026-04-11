import type { IRefreshTokenRepository } from "@domain/repositories/IRefreshTokenRepository";
import type { IUserRepository } from "@domain/repositories/IUserRepository";
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  REFRESH_TOKEN_TTL_MS,
} from "@infrastructure/auth/tokens";
import { UnauthorizedError } from "@presentation/errors";
import argon2 from "argon2";

type Deps = {
  userRepo: IUserRepository;
  refreshTokenRepo: IRefreshTokenRepository;
};

export async function loginUser(deps: Deps, email: string, password: string) {
  const user = await deps.userRepo.findByEmail(email);
  if (!user) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const valid = await argon2.verify(user.passwordHash, password);
  if (!valid) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken();
  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

  await deps.refreshTokenRepo.create({ userId: user.id, tokenHash, expiresAt });

  return {
    user: { id: user.id, email: user.email },
    accessToken,
    refreshToken,
  };
}
