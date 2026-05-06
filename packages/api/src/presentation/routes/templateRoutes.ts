import { addTemplateExercise } from "@application/usecases/templates/AddTemplateExercise";
import { addTemplateSet } from "@application/usecases/templates/AddTemplateSet";
import { createTemplate } from "@application/usecases/templates/CreateTemplate";
import { deleteTemplate } from "@application/usecases/templates/DeleteTemplate";
import { deleteTemplateSet } from "@application/usecases/templates/DeleteTemplateSet";
import { getTemplateById } from "@application/usecases/templates/GetTemplateById";
import { getTemplates } from "@application/usecases/templates/GetTemplates";
import { removeTemplateExercise } from "@application/usecases/templates/RemoveTemplateExercise";
import { updateTemplate } from "@application/usecases/templates/UpdateTemplate";
import { updateTemplateSet } from "@application/usecases/templates/UpdateTemplateSet";
import { WorkoutDifficulty, WorkoutType } from "@domain/entities/Workout";
import { createExerciseRepository } from "@infrastructure/repositories/ExerciseRepository";
import { createTemplateExerciseRepository } from "@infrastructure/repositories/TemplateExerciseRepository";
import { createTemplateSetRepository } from "@infrastructure/repositories/TemplateSetRepository";
import { createWorkoutPlanRepository } from "@infrastructure/repositories/WorkoutPlanRepository";
import { createWorkoutTemplateRepository } from "@infrastructure/repositories/WorkoutTemplateRepository";
import { ValidationError } from "@presentation/errors";
import type { AuthenticatedRequest } from "@presentation/middleware/authenticate";
import { type IRouter, type Request, Router } from "express";
import { z } from "zod";

export const templateRouter: IRouter = Router();

const createTemplateSchema = z.object({
  name: z.string().min(1),
  difficulty: z.nativeEnum(WorkoutDifficulty),
  type: z.nativeEnum(WorkoutType),
});

const addExerciseSchema = z.object({
  exerciseId: z.string().uuid(),
  section: z.enum(["main", "warmup", "cooldown"]),
});

const strengthSetSchema = z
  .object({
    setType: z.literal("strength"),
    setNumber: z.number().int().positive(),
    reps: z.number().int().positive(),
    weightKg: z.number().nonnegative(),
    restSeconds: z.number().int().nonnegative().optional(),
    notes: z.string().optional(),
  })
  .strict();

const cardioSetSchema = z
  .object({
    setType: z.literal("cardio"),
    setNumber: z.number().int().positive(),
    distanceMeters: z.number().nonnegative().optional(),
    durationSeconds: z.number().int().positive(),
    intensityLevel: z.number().int().min(1).max(10),
    notes: z.string().optional(),
  })
  .strict();

const hiitSetSchema = z
  .object({
    setType: z.literal("hiit"),
    setNumber: z.number().int().positive(),
    durationSeconds: z.number().int().positive(),
    restSeconds: z.number().int().nonnegative().optional(),
    notes: z.string().optional(),
  })
  .strict();

const mindBodySetSchema = z
  .object({
    setType: z.enum(["yoga", "pilates", "mobility"]),
    setNumber: z.number().int().positive(),
    durationSeconds: z.number().int().positive().optional(),
    reps: z.number().int().positive().optional(),
    notes: z.string().optional(),
  })
  .strict()
  .refine((d) => d.durationSeconds != null || d.reps != null, {
    message: "At least one of durationSeconds or reps must be provided",
  });

const createSetSchema = z.union([
  strengthSetSchema,
  cardioSetSchema,
  hiitSetSchema,
  mindBodySetSchema,
]);

const updateStrengthSetSchema = z
  .object({
    setType: z.literal("strength"),
    setNumber: z.number().int().positive().optional(),
    reps: z.number().int().positive().optional(),
    weightKg: z.number().nonnegative().optional(),
    restSeconds: z.number().int().nonnegative().nullable().optional(),
    notes: z.string().nullable().optional(),
  })
  .strict();

const updateCardioSetSchema = z
  .object({
    setType: z.literal("cardio"),
    setNumber: z.number().int().positive().optional(),
    distanceMeters: z.number().nonnegative().nullable().optional(),
    durationSeconds: z.number().int().positive().optional(),
    intensityLevel: z.number().int().min(1).max(10).optional(),
    notes: z.string().nullable().optional(),
  })
  .strict();

const updateHiitSetSchema = z
  .object({
    setType: z.literal("hiit"),
    setNumber: z.number().int().positive().optional(),
    durationSeconds: z.number().int().positive().optional(),
    restSeconds: z.number().int().nonnegative().nullable().optional(),
    notes: z.string().nullable().optional(),
  })
  .strict();

const updateMindBodySetSchema = z
  .object({
    setType: z.enum(["yoga", "pilates", "mobility"]),
    setNumber: z.number().int().positive().optional(),
    durationSeconds: z.number().int().positive().nullable().optional(),
    reps: z.number().int().positive().nullable().optional(),
    notes: z.string().nullable().optional(),
  })
  .strict();

const updateSetSchema = z.discriminatedUnion("setType", [
  updateStrengthSetSchema,
  updateCardioSetSchema,
  updateHiitSetSchema,
  updateMindBodySetSchema,
]);

// ─── Template CRUD ────────────────────────────────────────────────────────────

templateRouter.get("/", async (req: Request, res, next) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    const templates = await getTemplates(
      createWorkoutTemplateRepository(),
      userId,
    );
    res.json(templates);
  } catch (err) {
    next(err);
  }
});

templateRouter.post("/", async (req: Request, res, next) => {
  const result = createTemplateSchema.safeParse(req.body);
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
    const template = await createTemplate(
      createWorkoutTemplateRepository(),
      userId,
      result.data,
    );
    res.status(201).json(template);
  } catch (err) {
    next(err);
  }
});

templateRouter.get("/:templateId", async (req: Request, res, next) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    const template = await getTemplateById(
      createWorkoutTemplateRepository(),
      createTemplateExerciseRepository(),
      createTemplateSetRepository(),
      req.params.templateId,
      userId,
    );
    res.json(template);
  } catch (err) {
    next(err);
  }
});

templateRouter.delete("/:templateId", async (req: Request, res, next) => {
  try {
    const { userId } = req as AuthenticatedRequest;
    await deleteTemplate(
      createWorkoutTemplateRepository(),
      createWorkoutPlanRepository(),
      req.params.templateId,
      userId,
    );
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

const updateTemplateSchema = z.object({
  name: z.string().min(1).optional(),
  difficulty: z.nativeEnum(WorkoutDifficulty).optional(),
  type: z.nativeEnum(WorkoutType).optional(),
});

templateRouter.patch("/:templateId", async (req: Request, res, next) => {
  const result = updateTemplateSchema.safeParse(req.body);
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
    const template = await updateTemplate(
      createWorkoutTemplateRepository(),
      req.params.templateId,
      userId,
      result.data,
    );
    res.json(template);
  } catch (err) {
    next(err);
  }
});

// ─── Exercises ────────────────────────────────────────────────────────────────

templateRouter.post(
  "/:templateId/exercises",
  async (req: Request, res, next) => {
    const result = addExerciseSchema.safeParse(req.body);
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
      const exercise = await addTemplateExercise(
        createWorkoutTemplateRepository(),
        createTemplateExerciseRepository(),
        createExerciseRepository(),
        req.params.templateId,
        userId,
        result.data,
      );
      res.status(201).json(exercise);
    } catch (err) {
      next(err);
    }
  },
);

templateRouter.delete(
  "/:templateId/exercises/:templateExerciseId",
  async (req: Request, res, next) => {
    try {
      const { userId } = req as AuthenticatedRequest;
      await removeTemplateExercise(
        createWorkoutTemplateRepository(),
        createTemplateExerciseRepository(),
        createWorkoutPlanRepository(),
        req.params.templateId,
        req.params.templateExerciseId,
        userId,
      );
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);

// ─── Sets ─────────────────────────────────────────────────────────────────────

templateRouter.post(
  "/:templateId/exercises/:templateExerciseId/sets",
  async (req: Request, res, next) => {
    const result = createSetSchema.safeParse(req.body);
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
      const set = await addTemplateSet(
        createWorkoutTemplateRepository(),
        createTemplateExerciseRepository(),
        createTemplateSetRepository(),
        createExerciseRepository(),
        createWorkoutPlanRepository(),
        req.params.templateId,
        req.params.templateExerciseId,
        userId,
        result.data,
      );
      res.status(201).json(set);
    } catch (err) {
      next(err);
    }
  },
);

templateRouter.patch(
  "/:templateId/exercises/:templateExerciseId/sets/:setId",
  async (req: Request, res, next) => {
    const result = updateSetSchema.safeParse(req.body);
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
      const set = await updateTemplateSet(
        createWorkoutTemplateRepository(),
        createTemplateExerciseRepository(),
        createTemplateSetRepository(),
        createWorkoutPlanRepository(),
        req.params.templateId,
        req.params.templateExerciseId,
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

templateRouter.delete(
  "/:templateId/exercises/:templateExerciseId/sets/:setId",
  async (req: Request, res, next) => {
    try {
      const { userId } = req as AuthenticatedRequest;
      await deleteTemplateSet(
        createWorkoutTemplateRepository(),
        createTemplateExerciseRepository(),
        createTemplateSetRepository(),
        createWorkoutPlanRepository(),
        req.params.templateId,
        req.params.templateExerciseId,
        req.params.setId,
        userId,
      );
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);
