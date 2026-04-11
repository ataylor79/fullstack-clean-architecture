import type { IRefreshTokenRepository } from "@domain/repositories/IRefreshTokenRepository";
import type { IUserRepository } from "@domain/repositories/IUserRepository";
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  REFRESH_TOKEN_TTL_MS,
} from "@infrastructure/auth/tokens";
import { UnauthorizedError } from "@presentation/errors";

type Deps = {
  userRepo: IUserRepository;
  refreshTokenRepo: IRefreshTokenRepository;
};

export async function refreshTokens(deps: Deps, rawToken: string) {
  const tokenHash = hashToken(rawToken);
  const stored = await deps.refreshTokenRepo.findByTokenHash(tokenHash);

  if (!stored) {
    // Token not found — possible reuse of a rotated token; treat as breach
    throw new UnauthorizedError("Invalid refresh token");
  }

  if (stored.expiresAt < new Date()) {
    await deps.refreshTokenRepo.deleteByTokenHash(tokenHash);
    throw new UnauthorizedError("Refresh token expired");
  }

  const user = await deps.userRepo.findById(stored.userId);
  if (!user) {
    throw new UnauthorizedError("Invalid refresh token");
  }

  // Rotate: delete old token, issue new pair
  await deps.refreshTokenRepo.deleteByTokenHash(tokenHash);

  const accessToken = generateAccessToken(user.id);
  const newRefreshToken = generateRefreshToken();
  const newTokenHash = hashToken(newRefreshToken);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

  await deps.refreshTokenRepo.create({
    userId: user.id,
    tokenHash: newTokenHash,
    expiresAt,
  });

  return { accessToken, refreshToken: newRefreshToken };
}
