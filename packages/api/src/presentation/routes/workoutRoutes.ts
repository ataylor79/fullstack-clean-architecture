import { Router } from "express";
import { createWorkoutRepository } from "../../infrastructure/repositories/WorkoutRepository";
import { getWorkouts } from "../../application/usecases/workouts/GetWorkouts";
import { getWorkoutById } from "../../application/usecases/workouts/GetWorkoutById";
import { createWorkout } from "../../application/usecases/workouts/CreateWorkout";
import { updateWorkout } from "../../application/usecases/workouts/UpdateWorkout";
import { deleteWorkout } from "../../application/usecases/workouts/DeleteWorkout";
import { NotFoundError } from "../errors";

export const workoutRouter = Router();

workoutRouter.get("/", async (_req, res, next) => {
  try {
    const workouts = await getWorkouts(createWorkoutRepository());
    res.json(workouts);
  } catch (err) {
    next(err);
  }
});

workoutRouter.get("/:id", async (req, res, next) => {
  try {
    const workout = await getWorkoutById(createWorkoutRepository(), req.params.id);
    if (!workout) throw new NotFoundError("Workout not found");
    res.json(workout);
  } catch (err) {
    next(err);
  }
});

workoutRouter.post("/", async (req, res, next) => {
  try {
    const workout = await createWorkout(createWorkoutRepository(), {
      name: req.body.name,
      scheduledAt: new Date(req.body.scheduledAt),
    });
    res.status(201).json(workout);
  } catch (err) {
    next(err);
  }
});

workoutRouter.patch("/:id", async (req, res, next) => {
  try {
    const workout = await updateWorkout(createWorkoutRepository(), req.params.id, req.body);
    if (!workout) throw new NotFoundError("Workout not found");
    res.json(workout);
  } catch (err) {
    next(err);
  }
});

workoutRouter.delete("/:id", async (req, res, next) => {
  try {
    const deleted = await deleteWorkout(createWorkoutRepository(), req.params.id);
    if (!deleted) throw new NotFoundError("Workout not found");
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
