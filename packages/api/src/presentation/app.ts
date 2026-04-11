import express, { type Application } from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { authRouter } from "./routes/authRoutes";
import { workoutRouter } from "./routes/workoutRoutes";
import { exerciseRouter } from "./routes/exerciseRoutes";
import { errorHandler } from "./middleware/errorHandler";
import { openApiSpec } from "./openapi";

export function createApp(): Application {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  app.use("/auth", authRouter);

  app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));
  app.get("/docs.json", (_req, res) => res.json(openApiSpec));

  app.use("/api/workouts", workoutRouter);
  app.use("/api/exercises", exerciseRouter);

  app.use(errorHandler);

  return app;
}
