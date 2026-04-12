import { WorkoutDifficulty, WorkoutType } from "@domain/entities/Workout";
import type { IWorkoutRepository } from "@domain/repositories/IWorkoutRepository";

export interface CreateWorkoutInput {
  name: string;
  scheduledAt: Date;
  durationMinutes: number;
  difficulty: WorkoutDifficulty;
  type: WorkoutType;
}

export async function createWorkout(
  workoutRepo: IWorkoutRepository,
  userId: string,
  input: CreateWorkoutInput,
) {
  return workoutRepo.create({ ...input, userId, completedAt: null });
}
