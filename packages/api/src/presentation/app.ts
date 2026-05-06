import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Application } from "express";
import swaggerUi from "swagger-ui-express";
import { authenticate } from "./middleware/authenticate";
import { errorHandler } from "./middleware/errorHandler";
import { openApiSpec } from "./openapi";
import { authRouter } from "./routes/authRoutes";
import { exerciseRouter } from "./routes/exerciseRoutes";
import { planRouter } from "./routes/planRoutes";
import { templateRouter } from "./routes/templateRoutes";
import { workoutRouter } from "./routes/workoutRoutes";

export function createApp(): Application {
  const app = express();

  const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
    : [];

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);
        if (process.env.NODE_ENV !== "production") return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      },
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(cookieParser());

  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  app.use("/auth", authRouter);

  app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));
  app.get("/docs.json", (_req, res) => res.json(openApiSpec));

  app.use("/api/workouts", authenticate, workoutRouter);
  app.use("/api/exercises", authenticate, exerciseRouter);
  app.use("/api/templates", authenticate, templateRouter);
  app.use("/api/plans", authenticate, planRouter);

  app.use(errorHandler);

  return app;
}
