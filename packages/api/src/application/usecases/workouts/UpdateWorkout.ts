import type { WorkoutDifficulty, WorkoutType } from "@domain/entities/Workout";
import type { IExerciseRepository } from "@domain/repositories/IExerciseRepository";
import type { ISetRepository } from "@domain/repositories/ISetRepository";
import type { IWorkoutExerciseRepository } from "@domain/repositories/IWorkoutExerciseRepository";
import type { IWorkoutRepository } from "@domain/repositories/IWorkoutRepository";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "@presentation/errors";

export interface UpdateWorkoutInput {
  name?: string;
  scheduledAt?: Date;
  completedAt?: Date | null;
  durationMinutes?: number;
  difficulty?: WorkoutDifficulty;
  type?: WorkoutType;
  exercises?: string[]; // ordered array of exercise IDs
  rating?: number | null;
  notes?: string | null;
}

export async function updateWorkout(
  workoutRepo: IWorkoutRepository,
  setRepo: ISetRepository,
  workoutExerciseRepo: IWorkoutExerciseRepository,
  exerciseRepo: IExerciseRepository,
  id: string,
  userId: string,
  input: UpdateWorkoutInput,
) {
  const workout = await workoutRepo.findById(id, userId);
  if (!workout) throw new NotFoundError("Workout not found");

  const isStructuralChange =
    input.difficulty !== undefined ||
    input.type !== undefined ||
    input.exercises !== undefined;

  if (isStructuralChange) {
    const hasSets = await setRepo.existsByWorkoutId(id);
    if (hasSets) {
      throw new ConflictError(
        "Cannot change difficulty, type, or exercises after sets have been logged",
      );
    }
  }

  if (input.rating != null) {
    const effectiveCompletedAt = input.completedAt ?? workout.completedAt;
    if (effectiveCompletedAt == null) {
      throw new ValidationError(
        "Cannot rate a workout that has not been completed",
      );
    }
  }

  if (input.completedAt != null) {
    const effectiveScheduledAt = input.scheduledAt ?? workout.scheduledAt;
    if (input.completedAt < effectiveScheduledAt) {
      throw new ValidationError("completedAt cannot be before scheduledAt");
    }
  }

  const { exercises, ...workoutFields } = input;

  if (exercises !== undefined) {
    const exerciseChecks = await Promise.all(
      exercises.map((eid) => exerciseRepo.findById(eid)),
    );
    const missingIndex = exerciseChecks.indexOf(null);
    if (missingIndex !== -1) {
      throw new NotFoundError(`Exercise not found: ${exercises[missingIndex]}`);
    }

    await workoutExerciseRepo.replaceForWorkout(
      id,
      exercises.map((exerciseId, i) => ({
        exerciseId,
        section: "main" as const,
        orderIndex: i + 1,
      })),
    );
  }

  return workoutRepo.update(id, userId, workoutFields);
}
