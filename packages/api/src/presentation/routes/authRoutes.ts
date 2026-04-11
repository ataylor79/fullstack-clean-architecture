import { forgotPassword } from "@application/usecases/auth/ForgotPassword";
import { loginUser } from "@application/usecases/auth/LoginUser";
import { refreshTokens } from "@application/usecases/auth/RefreshTokens";
import { registerUser } from "@application/usecases/auth/RegisterUser";
import { resendVerificationEmail } from "@application/usecases/auth/ResendVerificationEmail";
import { resetPassword } from "@application/usecases/auth/ResetPassword";
import { verifyEmail } from "@application/usecases/auth/VerifyEmail";
import { hashToken, REFRESH_TOKEN_TTL_MS } from "@infrastructure/auth/tokens";
import { createEmailService } from "@infrastructure/email";
import { createEmailVerificationRepository } from "@infrastructure/repositories/EmailVerificationRepository";
import { createPasswordResetRepository } from "@infrastructure/repositories/PasswordResetRepository";
import { createRefreshTokenRepository } from "@infrastructure/repositories/RefreshTokenRepository";
import { createUserRepository } from "@infrastructure/repositories/UserRepository";
import { UnauthorizedError, ValidationError } from "@presentation/errors";
import type { AuthenticatedRequest } from "@presentation/middleware/authenticate";
import { authenticate } from "@presentation/middleware/authenticate";
import {
  type IRouter,
  type NextFunction,
  type Request,
  type Response,
  Router,
} from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === "test",
});

export const authRouter: IRouter = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
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
  authLimiter,
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
          emailVerificationRepo: createEmailVerificationRepository(),
          emailService: createEmailService(),
        },
        result.data.email,
        result.data.password,
      );

      setRefreshCookie(res, refreshToken);
      res.status(201).json({ user, accessToken });
    } catch (err) {
      next(err);
    }
  },
);

authRouter.post(
  "/login",
  authLimiter,
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
        result.data.password,
      );

      setRefreshCookie(res, refreshToken);
      res.status(200).json({ user, accessToken });
    } catch (err) {
      next(err);
    }
  },
);

authRouter.post(
  "/refresh",
  async (req: Request, res: Response, next: NextFunction) => {
    const rawToken = req.cookies?.refreshToken;
    if (!rawToken) {
      return next(new UnauthorizedError("No refresh token"));
    }

    try {
      const { accessToken, refreshToken } = await refreshTokens(
        {
          userRepo: createUserRepository(),
          refreshTokenRepo: createRefreshTokenRepository(),
        },
        rawToken,
      );

      setRefreshCookie(res, refreshToken);
      res.status(200).json({ accessToken });
    } catch (err) {
      next(err);
    }
  },
);

authRouter.post(
  "/logout",
  async (req: Request, res: Response, next: NextFunction) => {
    const rawToken = req.cookies?.refreshToken;

    try {
      if (rawToken) {
        await createRefreshTokenRepository().deleteByTokenHash(
          hashToken(rawToken),
        );
      }
      res.clearCookie("refreshToken");
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);

authRouter.get(
  "/verify",
  async (req: Request, res: Response, next: NextFunction) => {
    const token = req.query.token;

    if (!token || typeof token !== "string") {
      return next(new ValidationError("Verification token is required"));
    }

    try {
      await verifyEmail(
        {
          userRepo: createUserRepository(),
          emailVerificationRepo: createEmailVerificationRepository(),
        },
        token,
      );
      res.status(200).json({ message: "Email verified successfully" });
    } catch (err) {
      next(err);
    }
  },
);

authRouter.get(
  "/me",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req as AuthenticatedRequest;
      const user = await createUserRepository().findById(userId);
      if (!user) return next(new UnauthorizedError("User not found"));
      res.json({
        id: user.id,
        email: user.email,
        emailVerifiedAt: user.emailVerifiedAt,
        isAdmin: user.isAdmin,
      });
    } catch (err) {
      next(err);
    }
  },
);

authRouter.post(
  "/resend-verification",
  authLimiter,
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req as AuthenticatedRequest;
      await resendVerificationEmail(
        {
          userRepo: createUserRepository(),
          emailVerificationRepo: createEmailVerificationRepository(),
          emailService: createEmailService(),
        },
        userId,
      );
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);

authRouter.post(
  "/forgot-password",
  authLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    const result = forgotPasswordSchema.safeParse(req.body);
    if (!result.success) {
      return next(new ValidationError(result.error.errors[0].message));
    }

    try {
      await forgotPassword(
        {
          userRepo: createUserRepository(),
          passwordResetRepo: createPasswordResetRepository(),
          emailService: createEmailService(),
        },
        result.data.email,
      );
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);

authRouter.post(
  "/reset-password",
  authLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    const result = resetPasswordSchema.safeParse(req.body);
    if (!result.success) {
      return next(new ValidationError(result.error.errors[0].message));
    }

    try {
      await resetPassword(
        {
          userRepo: createUserRepository(),
          passwordResetRepo: createPasswordResetRepository(),
        },
        result.data.token,
        result.data.password,
      );
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);
