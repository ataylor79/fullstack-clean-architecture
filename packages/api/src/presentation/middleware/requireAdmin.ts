import { createUserRepository } from "@infrastructure/repositories/UserRepository";
import { ForbiddenError } from "@presentation/errors";
import type { NextFunction, Request, Response } from "express";
import type { AuthenticatedRequest } from "./authenticate";

export async function requireAdmin(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const { userId } = req as AuthenticatedRequest;
  const user = await createUserRepository().findById(userId);

  if (!user?.isAdmin) {
    return next(new ForbiddenError("Admin access required"));
  }

  next();
}
