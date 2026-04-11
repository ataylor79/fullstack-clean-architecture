import type { IWorkoutRepository } from "@domain/repositories/IWorkoutRepository";

export interface CreateWorkoutInput {
  name: string;
  scheduledAt: Date;
}

export async function createWorkout(
  workoutRepo: IWorkoutRepository,
  userId: string,
  input: CreateWorkoutInput,
) {
  return workoutRepo.create({ ...input, userId, completedAt: null });
}
