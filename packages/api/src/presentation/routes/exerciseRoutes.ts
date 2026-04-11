import { Router } from "express";
import { createExerciseRepository } from "../../infrastructure/repositories/ExerciseRepository";
import { NotFoundError } from "../errors";

export const exerciseRouter = Router();

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

exerciseRouter.post("/", async (req, res, next) => {
  try {
    const exercise = await createExerciseRepository().create(req.body);
    res.status(201).json(exercise);
  } catch (err) {
    next(err);
  }
});

exerciseRouter.patch("/:id", async (req, res, next) => {
  try {
    const exercise = await createExerciseRepository().update(req.params.id, req.body);
    if (!exercise) throw new NotFoundError("Exercise not found");
    res.json(exercise);
  } catch (err) {
    next(err);
  }
});

exerciseRouter.delete("/:id", async (req, res, next) => {
  try {
    const deleted = await createExerciseRepository().delete(req.params.id);
    if (!deleted) throw new NotFoundError("Exercise not found");
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
