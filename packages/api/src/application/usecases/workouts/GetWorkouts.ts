import type { IWorkoutRepository } from "@domain/repositories/IWorkoutRepository";

export async function getWorkouts(
  workoutRepo: IWorkoutRepository,
  userId: string,
  page: number,
  limit: number,
) {
  return workoutRepo.findAll(userId, page, limit);
}
