import type { WorkoutDifficulty, WorkoutType } from "@domain/entities/Workout";
import type { IExerciseRepository } from "@domain/repositories/IExerciseRepository";
import type { IWorkoutExerciseRepository } from "@domain/repositories/IWorkoutExerciseRepository";
import type { IWorkoutRepository } from "@domain/repositories/IWorkoutRepository";
import { NotFoundError } from "@presentation/errors";

export interface CreateWorkoutInput {
  name: string;
  scheduledAt: Date;
  durationMinutes: number;
  difficulty: WorkoutDifficulty;
  type: WorkoutType;
  exercises: string[]; // ordered array of exercise IDs
}

export async function createWorkout(
  workoutRepo: IWorkoutRepository,
  workoutExerciseRepo: IWorkoutExerciseRepository,
  exerciseRepo: IExerciseRepository,
  userId: string,
  input: CreateWorkoutInput,
) {
  // Validate all exercise IDs exist
  const exerciseChecks = await Promise.all(
    input.exercises.map((id) => exerciseRepo.findById(id)),
  );
  const missingIndex = exerciseChecks.indexOf(null);
  if (missingIndex !== -1) {
    throw new NotFoundError(
      `Exercise not found: ${input.exercises[missingIndex]}`,
    );
  }

  const { exercises: _exercises, ...workoutData } = input;
  const workout = await workoutRepo.create({
    ...workoutData,
    userId,
    planId: null,
    completedAt: null,
    rating: null,
    notes: null,
  });

  const exerciseEntries = input.exercises.map((exerciseId, i) => ({
    workoutId: workout.id,
    exerciseId,
    section: "main" as const,
    orderIndex: i + 1,
  }));
  const exercises = await workoutExerciseRepo.createMany(exerciseEntries);

  return { workout, exercises };
}
