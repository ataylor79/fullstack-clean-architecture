import { createSet } from "@application/usecases/sets/CreateSet";
import { deleteSet } from "@application/usecases/sets/DeleteSet";
import { updateSet } from "@application/usecases/sets/UpdateSet";
import { createWorkout } from "@application/usecases/workouts/CreateWorkout";
import { deleteWorkout } from "@application/usecases/workouts/DeleteWorkout";
import { getWorkoutById } from "@application/usecases/workouts/GetWorkoutById";
import { getWorkouts } from "@application/usecases/workouts/GetWorkouts";
import { updateWorkout } from "@application/usecases/workouts/UpdateWorkout";
import { createExerciseRepository } from "@infrastructure/repositories/ExerciseRepository";
import { createSetRepository } from "@infrastructure/repositories/SetRepository";
import { createWorkoutRepository } from "@infrastructure/repositories/WorkoutRepository";
import { NotFoundError, ValidationError } from "@presentation/errors";
import type { AuthenticatedRequest } from "@presentation/middleware/authenticate";
import { requireEmailVerified } from "@presentation/middleware/requireEmailVerified";
import { type IRouter, type Request, Router } from "express";
import { z } from "zod";

export const workoutRouter: IRouter = Router();

const createWorkoutSchema = z.object({
  name: z.string().min(1),
  scheduledAt: z.string().datetime(),
});

const updateWorkoutSchema = z.object({
  name: z.string().min(1).optional(),
  scheduledAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().nullable().optional(),
});

const createSetSchema = z.object({
  exerciseId: z.string().uuid(),
  setNumber: z.number().int().positive(),
  reps: z.number().int().positive(),
  weightKg: z.number().nonnegative(),
  notes: z.string().optional(),
});

const updateSetSchema = z.object({
  exerciseId: z.string().uuid().optional(),
  setNumber: z.number().int().positive().optional(),
  reps: z.number().int().positive().optional(),
  weightKg: z.number().nonnegative().optional(),
  notes: z.string().nullable().optional(),
});

// --- Workout routes ---

workoutRouter.get("/", async (req: Request, res, next) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    const workouts = await getWorkouts(createWorkoutRepository(), userId);
    res.json(workouts);
  } catch (err) {
    next(err);
  }
});

workoutRouter.get("/:id", async (req: Request, res, next) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    const workout = await getWorkoutById(
      createWorkoutRepository(),
      req.params.id,
      userId,
    );
    if (!workout) throw new NotFoundError("Workout not found");

    const sets = await createSetRepository().findByWorkoutId(workout.id);
    res.json({ ...workout, sets });
  } catch (err) {
    next(err);
  }
});

workoutRouter.post(
  "/",
  requireEmailVerified,
  async (req: Request, res, next) => {
    const result = createWorkoutSchema.safeParse(req.body);
    if (!result.success) {
      return next(new ValidationError(result.error.errors[0].message));
    }

    try {
      const { userId } = req as AuthenticatedRequest;
      const workout = await createWorkout(createWorkoutRepository(), userId, {
        name: result.data.name,
        scheduledAt: new Date(result.data.scheduledAt),
      });
      res.status(201).json(workout);
    } catch (err) {
      next(err);
    }
  },
);

workoutRouter.patch("/:id", async (req: Request, res, next) => {
  const result = updateWorkoutSchema.safeParse(req.body);
  if (!result.success) {
    return next(new ValidationError(result.error.errors[0].message));
  }

  try {
    const { userId } = req as AuthenticatedRequest;
    const data = {
      ...(result.data.name !== undefined && { name: result.data.name }),
      ...(result.data.scheduledAt !== undefined && {
        scheduledAt: new Date(result.data.scheduledAt),
      }),
      ...(result.data.completedAt !== undefined && {
        completedAt: result.data.completedAt
          ? new Date(result.data.completedAt)
          : null,
      }),
    };
    const workout = await updateWorkout(
      createWorkoutRepository(),
      req.params.id,
      userId,
      data,
    );
    if (!workout) throw new NotFoundError("Workout not found");
    res.json(workout);
  } catch (err) {
    next(err);
  }
});

workoutRouter.delete("/:id", async (req: Request, res, next) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    const deleted = await deleteWorkout(
      createWorkoutRepository(),
      req.params.id,
      userId,
    );
    if (!deleted) throw new NotFoundError("Workout not found");
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// --- Set routes ---

workoutRouter.post("/:workoutId/sets", async (req: Request, res, next) => {
  const result = createSetSchema.safeParse(req.body);
  if (!result.success) {
    return next(new ValidationError(result.error.errors[0].message));
  }

  try {
    const { userId } = req as AuthenticatedRequest;
    const set = await createSet(
      createWorkoutRepository(),
      createSetRepository(),
      createExerciseRepository(),
      req.params.workoutId,
      userId,
      result.data,
    );
    res.status(201).json(set);
  } catch (err) {
    next(err);
  }
});

workoutRouter.patch(
  "/:workoutId/sets/:setId",
  async (req: Request, res, next) => {
    const result = updateSetSchema.safeParse(req.body);
    if (!result.success) {
      return next(new ValidationError(result.error.errors[0].message));
    }

    try {
      const { userId } = req as AuthenticatedRequest;
      const set = await updateSet(
        createWorkoutRepository(),
        createSetRepository(),
        req.params.workoutId,
        req.params.setId,
        userId,
        result.data,
      );
      res.json(set);
    } catch (err) {
      next(err);
    }
  },
);

workoutRouter.delete(
  "/:workoutId/sets/:setId",
  async (req: Request, res, next) => {
    try {
      const { userId } = req as AuthenticatedRequest;
      await deleteSet(
        createWorkoutRepository(),
        createSetRepository(),
        req.params.workoutId,
        req.params.setId,
        userId,
      );
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);
