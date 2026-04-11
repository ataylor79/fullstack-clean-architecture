import { createUserRepository } from "@infrastructure/repositories/UserRepository";
import { ForbiddenError } from "@presentation/errors";
import type { NextFunction, Request, Response } from "express";
import type { AuthenticatedRequest } from "./authenticate";

export async function requireEmailVerified(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const { userId } = req as AuthenticatedRequest;
  const user = await createUserRepository().findById(userId);

  if (!user?.emailVerifiedAt) {
    return next(new ForbiddenError("Email verification required"));
  }

  next();
}
