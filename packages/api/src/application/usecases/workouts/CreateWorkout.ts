import type { IWorkoutRepository } from "../../../domain/repositories/IWorkoutRepository";

export interface CreateWorkoutInput {
  name: string;
  scheduledAt: Date;
}

export async function createWorkout(workoutRepo: IWorkoutRepository, input: CreateWorkoutInput) {
  return workoutRepo.create({ ...input, completedAt: null });
}
