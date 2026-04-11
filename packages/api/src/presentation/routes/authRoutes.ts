import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { createUserRepository } from "../../infrastructure/repositories/UserRepository";
import { createRefreshTokenRepository } from "../../infrastructure/repositories/RefreshTokenRepository";
import { registerUser } from "../../application/usecases/auth/RegisterUser";
import { loginUser } from "../../application/usecases/auth/LoginUser";
import { ValidationError } from "../errors";
import { REFRESH_TOKEN_TTL_MS } from "../../infrastructure/auth/tokens";

export const authRouter = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function setRefreshCookie(res: Response, token: string) {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: REFRESH_TOKEN_TTL_MS,
  });
}

authRouter.post(
  "/register",
  async (req: Request, res: Response, next: NextFunction) => {
    const result = registerSchema.safeParse(req.body);
    if (!result.success) {
      return next(new ValidationError(result.error.errors[0].message));
    }

    try {
      const { user, accessToken, refreshToken } = await registerUser(
        {
          userRepo: createUserRepository(),
          refreshTokenRepo: createRefreshTokenRepository(),
        },
        result.data.email,
        result.data.password
      );

      setRefreshCookie(res, refreshToken);
      res.status(201).json({ user, accessToken });
    } catch (err) {
      next(err);
    }
  }
);

authRouter.post(
  "/login",
  async (req: Request, res: Response, next: NextFunction) => {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      return next(new ValidationError(result.error.errors[0].message));
    }

    try {
      const { user, accessToken, refreshToken } = await loginUser(
        {
          userRepo: createUserRepository(),
          refreshTokenRepo: createRefreshTokenRepository(),
        },
        result.data.email,
        result.data.password
      );

      setRefreshCookie(res, refreshToken);
      res.status(200).json({ user, accessToken });
    } catch (err) {
      next(err);
    }
  }
);
