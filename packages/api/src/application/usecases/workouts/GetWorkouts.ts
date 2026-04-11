import type { IWorkoutRepository } from "../../../domain/repositories/IWorkoutRepository";

export async function getWorkouts(workoutRepo: IWorkoutRepository) {
  return workoutRepo.findAll();
}
