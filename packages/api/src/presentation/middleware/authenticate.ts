import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../../infrastructure/auth/tokens";
import { UnauthorizedError } from "../errors";

export interface AuthenticatedRequest extends Request {
  userId: string;
}

export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return next(new UnauthorizedError("Missing or invalid Authorization header"));
  }

  const token = header.slice(7);
  try {
    const payload = verifyAccessToken(token);
    (req as AuthenticatedRequest).userId = payload.sub;
    next();
  } catch {
    next(new UnauthorizedError("Invalid or expired access token"));
  }
}
