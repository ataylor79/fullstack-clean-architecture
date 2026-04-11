import type { IWorkoutRepository } from "../../../domain/repositories/IWorkoutRepository";

export async function getWorkoutById(workoutRepo: IWorkoutRepository, id: string) {
  return workoutRepo.findById(id);
}
