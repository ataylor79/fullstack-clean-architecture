import type { IExerciseRepository } from "@domain/repositories/IExerciseRepository";
import type { ISetRepository } from "@domain/repositories/ISetRepository";
import type { IWorkoutRepository } from "@domain/repositories/IWorkoutRepository";
import {
  allowedSetTypesForWorkout,
  requiredExerciseCategoryForSetType,
} from "@domain/services/setTypeStrategy";
import type { TypedSetInput } from "@domain/services/setTypeStrategy";
import { ConflictError, NotFoundError, ValidationError } from "@presentation/errors";

// PG unique violation error code
const PG_UNIQUE_VIOLATION = "23505";

export async function createSet(
  workoutRepo: IWorkoutRepository,
  setRepo: ISetRepository,
  exerciseRepo: IExerciseRepository,
  workoutId: string,
  userId: string,
  input: { setNumber: number; notes?: string } & TypedSetInput,
) {
  const workout = await workoutRepo.findById(workoutId, userId);
  if (!workout) throw new NotFoundError("Workout not found");

  const allowed = allowedSetTypesForWorkout(workout.type);
  if (!allowed.has(input.setType)) {
    throw new ValidationError(
      `Workout type "${workout.type}" does not allow set type "${input.setType}"`,
    );
  }

  const exercise = await exerciseRepo.findById(input.exerciseId);
  if (!exercise) throw new NotFoundError("Exercise not found");

  const requiredCategory = requiredExerciseCategoryForSetType(input.setType);
  if (exercise.exerciseCategory !== requiredCategory) {
    throw new ValidationError(
      `Exercise category "${exercise.exerciseCategory}" does not match required category "${requiredCategory}" for set type "${input.setType}"`,
    );
  }

  try {
    return await setRepo.create(buildCreateData(workoutId, input));
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code?: string }).code === PG_UNIQUE_VIOLATION
    ) {
      throw new ConflictError("Set number already exists for this exercise in this workout");
    }
    throw err;
  }
}

function buildCreateData(
  workoutId: string,
  input: { setNumber: number; notes?: string } & TypedSetInput,
) {
  const base = { workoutId, setNumber: input.setNumber, notes: input.notes ?? null };

  switch (input.setType) {
    case "strength":
      return {
        ...base,
        setType: "strength" as const,
        exerciseId: input.exerciseId,
        reps: input.reps,
        weightKg: input.weightKg,
        restSeconds: input.restSeconds ?? null,
      };
    case "cardio":
      return {
        ...base,
        setType: "cardio" as const,
        exerciseId: input.exerciseId,
        distanceMeters: input.distanceMeters ?? null,
        durationSeconds: input.durationSeconds,
        intensityLevel: input.intensityLevel,
      };
    case "hiit":
      return {
        ...base,
        setType: "hiit" as const,
        exerciseId: input.exerciseId,
        durationSeconds: input.durationSeconds,
        restSeconds: input.restSeconds ?? null,
      };
    case "yoga":
    case "pilates":
    case "mobility":
      return {
        ...base,
        setType: input.setType,
        exerciseId: input.exerciseId,
        durationSeconds: input.durationSeconds ?? null,
        reps: input.reps ?? null,
      };
  }
}
