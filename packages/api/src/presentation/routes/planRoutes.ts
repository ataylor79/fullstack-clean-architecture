import { createPlan } from "@application/usecases/plans/CreatePlan";
import { deletePlan } from "@application/usecases/plans/DeletePlan";
import { getPlans } from "@application/usecases/plans/GetPlans";
import { startWorkoutFromPlan } from "@application/usecases/plans/StartWorkoutFromPlan";
import { updatePlan } from "@application/usecases/plans/UpdatePlan";
import { createTemplateExerciseRepository } from "@infrastructure/repositories/TemplateExerciseRepository";
import { createTemplateSetRepository } from "@infrastructure/repositories/TemplateSetRepository";
import { createWorkoutExerciseRepository } from "@infrastructure/repositories/WorkoutExerciseRepository";
import { createWorkoutPlanRepository } from "@infrastructure/repositories/WorkoutPlanRepository";
import { createWorkoutRepository } from "@infrastructure/repositories/WorkoutRepository";
import { createWorkoutTemplateRepository } from "@infrastructure/repositories/WorkoutTemplateRepository";
import { NotFoundError, ValidationError } from "@presentation/errors";
import type { AuthenticatedRequest } from "@presentation/middleware/authenticate";
import { requireEmailVerified } from "@presentation/middleware/requireEmailVerified";
import { type IRouter, type Request, Router } from "express";
import { z } from "zod";

export const planRouter: IRouter = Router();

const DAYS_OF_WEEK = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

const createPlanSchema = z.object({
  templateId: z.string().uuid(),
  daysOfWeek: z.array(z.enum(DAYS_OF_WEEK)).min(1),
  numWeeks: z.number().int().positive(),
});

planRouter.get("/", async (req: Request, res, next) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    const plans = await getPlans(createWorkoutPlanRepository(), userId);
    res.json(plans);
  } catch (err) {
    next(err);
  }
});

planRouter.post("/", async (req: Request, res, next) => {
  const result = createPlanSchema.safeParse(req.body);
  if (!result.success) {
    return next(
      new ValidationError(
        "Validation failed",
        result.error.errors.map((e) => e.message),
      ),
    );
  }
  try {
    const { userId } = req as AuthenticatedRequest;
    const plan = await createPlan(
      createWorkoutTemplateRepository(),
      createTemplateExerciseRepository(),
      createTemplateSetRepository(),
      createWorkoutPlanRepository(),
      userId,
      result.data,
    );
    res.status(201).json(plan);
  } catch (err) {
    next(err);
  }
});

planRouter.get("/:id", async (req: Request, res, next) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    const plan = await createWorkoutPlanRepository().findById(
      req.params.id,
      userId,
    );
    if (!plan) throw new NotFoundError("Plan not found");
    res.json(plan);
  } catch (err) {
    next(err);
  }
});

const updatePlanSchema = z.object({
  daysOfWeek: z.array(z.enum(DAYS_OF_WEEK)).min(1).optional(),
  numWeeks: z.number().int().positive().optional(),
});

planRouter.patch("/:id", async (req: Request, res, next) => {
  const result = updatePlanSchema.safeParse(req.body);
  if (!result.success) {
    return next(
      new ValidationError(
        "Validation failed",
        result.error.errors.map((e) => e.message),
      ),
    );
  }
  try {
    const { userId } = req as AuthenticatedRequest;
    const plan = await updatePlan(
      createWorkoutPlanRepository(),
      req.params.id,
      userId,
      result.data,
    );
    res.json(plan);
  } catch (err) {
    next(err);
  }
});

planRouter.delete("/:id", async (req: Request, res, next) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    await deletePlan(createWorkoutPlanRepository(), req.params.id, userId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

const startWorkoutSchema = z.object({
  scheduledAt: z.string().datetime(),
});

planRouter.post(
  "/:planId/workouts",
  requireEmailVerified,
  async (req: Request, res, next) => {
    const result = startWorkoutSchema.safeParse(req.body);
    if (!result.success) {
      return next(
        new ValidationError(
          "Validation failed",
          result.error.errors.map((e) => e.message),
        ),
      );
    }
    try {
      const { userId } = req as AuthenticatedRequest;
      const workoutWithExercises = await startWorkoutFromPlan(
        createWorkoutPlanRepository(),
        createWorkoutTemplateRepository(),
        createTemplateExerciseRepository(),
        createWorkoutRepository(),
        createWorkoutExerciseRepository(),
        req.params.planId,
        userId,
        { scheduledAt: new Date(result.data.scheduledAt) },
      );
      res.status(201).json(workoutWithExercises);
    } catch (err) {
      next(err);
    }
  },
);

planRouter.get("/:planId/workouts", async (req: Request, res, next) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    const plan = await createWorkoutPlanRepository().findById(
      req.params.planId,
      userId,
    );
    if (!plan) throw new NotFoundError("Plan not found");
    const workouts = await createWorkoutRepository().findByPlanId(
      req.params.planId,
      userId,
    );
    res.json(workouts);
  } catch (err) {
    next(err);
  }
});
