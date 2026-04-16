import { ExerciseCategory } from "@domain/entities/Exercise";
import { createExerciseRepository } from "@infrastructure/repositories/ExerciseRepository";
import { ConflictError, NotFoundError, ValidationError } from "@presentation/errors";
import { requireAdmin } from "@presentation/middleware/requireAdmin";
import { type IRouter, Router } from "express";
import { z } from "zod";

export const exerciseRouter: IRouter = Router();

const PG_UNIQUE_VIOLATION = "23505";

const createExerciseSchema = z.object({
  name: z.string().min(1),
  exerciseCategory: z.nativeEnum(ExerciseCategory),
  muscleGroup: z.string().min(1).optional(),
  notes: z.string().optional(),
});

const updateExerciseSchema = z
  .object({
    name: z.string().min(1).optional(),
    exerciseCategory: z.nativeEnum(ExerciseCategory).optional(),
    muscleGroup: z.string().min(1).nullable().optional(),
    notes: z.string().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

exerciseRouter.get("/", async (_req, res, next) => {
  try {
    const exercises = await createExerciseRepository().findAll();
    res.json(exercises);
  } catch (err) {
    next(err);
  }
});

exerciseRouter.get("/:id", async (req, res, next) => {
  try {
    const exercise = await createExerciseRepository().findById(req.params.id);
    if (!exercise) throw new NotFoundError("Exercise not found");
    res.json(exercise);
  } catch (err) {
    next(err);
  }
});

exerciseRouter.post("/", requireAdmin, async (req, res, next) => {
  const result = createExerciseSchema.safeParse(req.body);
  if (!result.success) {
    return next(new ValidationError(result.error.errors[0].message));
  }

  try {
    const exercise = await createExerciseRepository().create({
      name: result.data.name,
      exerciseCategory: result.data.exerciseCategory,
      muscleGroup: result.data.muscleGroup ?? null,
      notes: result.data.notes ?? null,
    });
    res.status(201).json(exercise);
  } catch (err: any) {
    if (err?.code === PG_UNIQUE_VIOLATION) {
      return next(new ConflictError("Exercise name already exists"));
    }
    next(err);
  }
});

exerciseRouter.patch("/:id", requireAdmin, async (req, res, next) => {
  const result = updateExerciseSchema.safeParse(req.body);
  if (!result.success) {
    return next(new ValidationError(result.error.errors[0].message));
  }

  try {
    const exercise = await createExerciseRepository().update(
      req.params.id,
      result.data,
    );
    if (!exercise) throw new NotFoundError("Exercise not found");
    res.json(exercise);
  } catch (err: any) {
    if (err?.code === PG_UNIQUE_VIOLATION) {
      return next(new ConflictError("Exercise name already exists"));
    }
    next(err);
  }
});

exerciseRouter.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    const deleted = await createExerciseRepository().delete(req.params.id);
    if (!deleted) throw new NotFoundError("Exercise not found");
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
