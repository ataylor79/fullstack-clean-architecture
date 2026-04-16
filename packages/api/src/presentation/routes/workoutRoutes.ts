import { createSet } from "@application/usecases/sets/CreateSet";
import { deleteSet } from "@application/usecases/sets/DeleteSet";
import { updateSet } from "@application/usecases/sets/UpdateSet";
import { createWorkout } from "@application/usecases/workouts/CreateWorkout";
import { deleteWorkout } from "@application/usecases/workouts/DeleteWorkout";
import { getWorkoutById } from "@application/usecases/workouts/GetWorkoutById";
import { getWorkouts } from "@application/usecases/workouts/GetWorkouts";
import { updateWorkout } from "@application/usecases/workouts/UpdateWorkout";
import { WorkoutDifficulty, WorkoutType } from "@domain/entities/Workout";
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
  durationMinutes: z.number().int().positive(),
  difficulty: z.nativeEnum(WorkoutDifficulty),
  type: z.nativeEnum(WorkoutType),
  scheduledAt: z.string().datetime(),
});

const updateWorkoutSchema = z.object({
  name: z.string().min(1).optional(),
  scheduledAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().nullable().optional(),
  durationMinutes: z.number().int().positive().optional(),
  difficulty: z.nativeEnum(WorkoutDifficulty).optional(),
  type: z.nativeEnum(WorkoutType).optional(),
});

const strengthSetSchema = z.object({
  setType: z.literal("strength"),
  setNumber: z.number().int().positive(),
  exerciseId: z.string().uuid(),
  reps: z.number().int().positive(),
  weightKg: z.number().nonnegative(),
  restSeconds: z.number().int().nonnegative().optional(),
  notes: z.string().optional(),
}).strict();

const cardioSetSchema = z.object({
  setType: z.literal("cardio"),
  setNumber: z.number().int().positive(),
  exerciseId: z.string().uuid(),
  distanceMeters: z.number().nonnegative().optional(),
  durationSeconds: z.number().int().positive(),
  intensityLevel: z.number().int().min(1).max(10),
  notes: z.string().optional(),
}).strict();

const hiitSetSchema = z.object({
  setType: z.literal("hiit"),
  setNumber: z.number().int().positive(),
  exerciseId: z.string().uuid(),
  durationSeconds: z.number().int().positive(),
  restSeconds: z.number().int().nonnegative().optional(),
  notes: z.string().optional(),
}).strict();

const mindBodySetSchema = z.object({
  setType: z.enum(["yoga", "pilates", "mobility"]),
  setNumber: z.number().int().positive(),
  exerciseId: z.string().uuid(),
  durationSeconds: z.number().int().positive().optional(),
  reps: z.number().int().positive().optional(),
  notes: z.string().optional(),
}).strict().refine(
  (d) => d.durationSeconds != null || d.reps != null,
  { message: "At least one of durationSeconds or reps must be provided" },
);

// z.union is used (not discriminatedUnion) because mindBodySetSchema uses .refine(), which wraps
// it in ZodEffects — incompatible with discriminatedUnion's ZodObject requirement.
const createSetSchema = z.union([
  strengthSetSchema,
  cardioSetSchema,
  hiitSetSchema,
  mindBodySetSchema,
]);

const updateStrengthSetSchema = z.object({
  setType: z.literal("strength"),
  setNumber: z.number().int().positive().optional(),
  exerciseId: z.string().uuid().optional(),
  reps: z.number().int().positive().optional(),
  weightKg: z.number().nonnegative().optional(),
  restSeconds: z.number().int().nonnegative().nullable().optional(),
  notes: z.string().nullable().optional(),
}).strict();

const updateCardioSetSchema = z.object({
  setType: z.literal("cardio"),
  setNumber: z.number().int().positive().optional(),
  exerciseId: z.string().uuid().optional(),
  distanceMeters: z.number().nonnegative().nullable().optional(),
  durationSeconds: z.number().int().positive().optional(),
  intensityLevel: z.number().int().min(1).max(10).optional(),
  notes: z.string().nullable().optional(),
}).strict();

const updateHiitSetSchema = z.object({
  setType: z.literal("hiit"),
  setNumber: z.number().int().positive().optional(),
  exerciseId: z.string().uuid().optional(),
  durationSeconds: z.number().int().positive().optional(),
  restSeconds: z.number().int().nonnegative().nullable().optional(),
  notes: z.string().nullable().optional(),
}).strict();

const updateMindBodySetSchema = z.object({
  setType: z.enum(["yoga", "pilates", "mobility"]),
  setNumber: z.number().int().positive().optional(),
  exerciseId: z.string().uuid().optional(),
  durationSeconds: z.number().int().positive().nullable().optional(),
  reps: z.number().int().positive().nullable().optional(),
  notes: z.string().nullable().optional(),
}).strict();

const updateSetSchema = z.discriminatedUnion("setType", [
  updateStrengthSetSchema,
  updateCardioSetSchema,
  updateHiitSetSchema,
  updateMindBodySetSchema,
]);

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
        durationMinutes: result.data.durationMinutes,
        difficulty: result.data.difficulty,
        type: result.data.type,
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
      ...(result.data.durationMinutes !== undefined && {
        durationMinutes: result.data.durationMinutes,
      }),
      ...(result.data.difficulty !== undefined && {
        difficulty: result.data.difficulty,
      }),
      ...(result.data.type !== undefined && { type: result.data.type }),
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
        createExerciseRepository(),
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
