import type { IWorkoutRepository } from "../../../domain/repositories/IWorkoutRepository";

export async function getWorkouts(workoutRepo: IWorkoutRepository, userId: string) {
  return workoutRepo.findAll(userId);
}
