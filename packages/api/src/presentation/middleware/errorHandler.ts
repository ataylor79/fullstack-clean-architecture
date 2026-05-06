import { AppError, ValidationError } from "@presentation/errors";
import type { NextFunction, Request, Response } from "express";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof AppError) {
    const body: Record<string, unknown> = {
      error: err.message,
      code: err.code,
    };
    if (err instanceof ValidationError && err.details?.length) {
      body.details = err.details;
    }
    res.status(err.statusCode).json(body);
    return;
  }
  console.error(err);
  res
    .status(500)
    .json({ error: "Internal server error", code: "INTERNAL_ERROR" });
}
